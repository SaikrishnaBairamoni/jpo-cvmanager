from unittest.mock import patch, MagicMock, call
import pytest
import src.admin_org as admin_org
import tests.data.admin_org_data as admin_org_data
import sqlalchemy
from werkzeug.exceptions import HTTPException

###################################### Testing Requests ##########################################

# OPTIONS endpoint test

def test_request_options():
  info = admin_org.AdminOrg()
  (body, code, headers) = info.options()
  assert body == ''
  assert code == 204
  assert headers['Access-Control-Allow-Methods'] == 'GET,PATCH,DELETE'

# GET endpoint tests

@patch('src.admin_org.get_modify_org_data')
def test_entry_get(mock_get_modify_org_data):
  req = MagicMock()
  req.environ = admin_org_data.request_environ
  req.args = admin_org_data.request_args_good
  mock_get_modify_org_data.return_value = {}
  with patch("src.admin_org.request", req):
      status = admin_org.AdminOrg()
      (body, code, headers) = status.get()

      mock_get_modify_org_data.assert_called_once_with(admin_org_data.request_args_good['org_name'])
      assert code == 200
      assert headers['Access-Control-Allow-Origin'] == "*"
      assert body == {}

# Test schema for string value
def test_entry_get_schema_str():
  req = MagicMock()
  req.environ = admin_org_data.request_environ
  req.args = admin_org_data.request_args_bad
  with patch("src.admin_org.request", req):
      status = admin_org.AdminOrg()
      with pytest.raises(HTTPException):
          status.get()

# PATCH endpoint tests

@patch('src.admin_org.modify_org')
def test_entry_patch(mock_modify_org):
  req = MagicMock()
  req.environ = admin_org_data.request_environ
  req.json = admin_org_data.request_json_good
  mock_modify_org.return_value = {}, 200
  with patch("src.admin_org.request", req):
      status = admin_org.AdminOrg()
      (body, code, headers) = status.patch()

      mock_modify_org.assert_called_once()
      assert code == 200
      assert headers['Access-Control-Allow-Origin'] == "*"
      assert body == {}

def test_entry_patch_schema():
  req = MagicMock()
  req.environ = admin_org_data.request_environ
  req.json = admin_org_data.request_json_bad
  with patch("src.admin_org.request", req):
      status = admin_org.AdminOrg()
      with pytest.raises(HTTPException):
          status.patch()

# DELETE endpoint tests

@patch('src.admin_org.delete_org')
def test_entry_delete_user(mock_delete_org):
  req = MagicMock()
  req.environ = admin_org_data.request_environ
  req.args = admin_org_data.request_args_good
  mock_delete_org.return_value = {}
  with patch("src.admin_org.request", req):
      status = admin_org.AdminOrg()
      (body, code, headers) = status.delete()

      mock_delete_org.assert_called_once_with(admin_org_data.request_args_good['org_name'])
      assert code == 200
      assert headers['Access-Control-Allow-Origin'] == "*"
      assert body == {}

def test_entry_delete_schema():
  req = MagicMock()
  req.environ = admin_org_data.request_environ
  req.args = admin_org_data.request_args_bad
  with patch("src.admin_org.request", req):
      status = admin_org.AdminOrg()
      with pytest.raises(HTTPException):
          status.delete()

###################################### Testing Functions ##########################################

# get_all_orgs

@patch('src.admin_org.pgquery')
def test_get_all_orgs(mock_pgquery):
  mock_pgquery.query_db.return_value = admin_org_data.get_all_orgs_pgdb_return
  expected_result = admin_org_data.get_all_orgs_result
  expected_query = admin_org_data.get_all_orgs_sql
  actual_result = admin_org.get_all_orgs()

  mock_pgquery.query_db.assert_called_with(expected_query)
  assert actual_result == expected_result

# get_org_data

@patch('src.admin_org.pgquery')
def test_get_all_orgs(mock_pgquery):
  mock_pgquery.query_db.side_effect = [
    admin_org_data.get_org_data_user_return, 
    admin_org_data.get_org_data_rsu_return
    ]
  expected_result = admin_org_data.get_org_data_result
  actual_result = admin_org.get_org_data("test org")

  calls = [
      call(admin_org_data.get_org_data_user_sql),
      call(admin_org_data.get_org_data_rsu_sql)
      ]
  mock_pgquery.query_db.assert_has_calls(calls)
  assert actual_result == expected_result

# get_allowed_selections

@patch('src.admin_org.pgquery')
def test_get_allowed_selections(mock_pgquery):
  mock_pgquery.query_db.return_value = admin_org_data.get_allowed_selections_return
  expected_result = admin_org_data.get_allowed_selections_result
  actual_result = admin_org.get_allowed_selections()

  mock_pgquery.query_db.assert_called_with(admin_org_data.get_allowed_selections_sql)
  assert actual_result == expected_result

# get_modify_org_data

@patch('src.admin_org.get_all_orgs')
def test_get_modify_org_data_all(mock_get_all_orgs):
  mock_get_all_orgs.return_value = ["test org data"]
  expected_rsu_data = { 
    "org_data": ["test org data"]
  }
  actual_result = admin_org.get_modify_org_data("all")

  assert actual_result == expected_rsu_data

@patch('src.admin_org.get_allowed_selections')
@patch('src.admin_org.get_org_data')
def test_get_modify_org_data_all(mock_get_org_data, mock_get_allowed_selections):
  mock_get_org_data.return_value = "test org data"
  mock_get_allowed_selections.return_value = ["allowed_selections"]
  expected_rsu_data = { 
    "org_data": "test org data",
    "allowed_selections": ["allowed_selections"]
  }
  actual_result = admin_org.get_modify_org_data("test org")

  assert actual_result == expected_rsu_data

# check_safe_input

def test_check_safe_input():
  expected_result = True
  actual_result = admin_org.check_safe_input(admin_org_data.request_json_good)
  assert actual_result == expected_result

def test_check_safe_input_bad():
  expected_result = False
  actual_result = admin_org.check_safe_input(admin_org_data.request_json_unsafe_input)
  assert actual_result == expected_result

# modify_org

@patch('src.admin_org.check_safe_input')
@patch('src.admin_org.pgquery.insert_db')
def test_modify_user_success(mock_pgquery, mock_check_safe_input):
  mock_check_safe_input.return_value = True
  expected_msg, expected_code = {"message": "Organization successfully modified"}, 200
  actual_msg, actual_code = admin_org.modify_org(admin_org_data.request_json_good)

  calls = [
      call(admin_org_data.modify_org_sql),
      call(admin_org_data.modify_org_add_user_sql),
      call(admin_org_data.modify_org_modify_user_sql),
      call(admin_org_data.modify_org_remove_user_sql),
      call(admin_org_data.modify_org_add_rsu_sql),
      call(admin_org_data.modify_org_remove_rsu_sql)
      ]
  mock_pgquery.assert_has_calls(calls)
  assert actual_msg == expected_msg
  assert actual_code == expected_code

@patch('src.admin_org.check_safe_input')
@patch('src.admin_org.pgquery.insert_db')
def test_modify_org_check_fail(mock_pgquery, mock_check_safe_input):
  mock_check_safe_input.return_value = False
  expected_msg, expected_code = {"message": "No special characters are allowed: !\"#$%&'()*+,./:;<=>?@[\\]^`{|}~. No sequences of '-' characters are allowed"}, 500
  actual_msg, actual_code = admin_org.modify_org(admin_org_data.request_json_good)

  calls = []
  mock_pgquery.assert_has_calls(calls)
  assert actual_msg == expected_msg
  assert actual_code == expected_code

@patch('src.admin_org.check_safe_input')
@patch('src.admin_org.pgquery.insert_db')
def test_modify_org_generic_exception(mock_pgquery, mock_check_safe_input):
  mock_check_safe_input.return_value = True
  mock_pgquery.side_effect = Exception('Test')
  expected_msg, expected_code = {"message": "Encountered unknown issue"}, 500
  actual_msg, actual_code = admin_org.modify_org(admin_org_data.request_json_good)

  assert actual_msg == expected_msg
  assert actual_code == expected_code

@patch('src.admin_org.check_safe_input')
@patch('src.admin_org.pgquery.insert_db')
def test_modify_org_sql_exception(mock_pgquery, mock_check_safe_input):
  mock_check_safe_input.return_value = True
  orig = MagicMock()
  orig.args = ({'D': 'SQL issue encountered'},)
  mock_pgquery.side_effect = sqlalchemy.exc.IntegrityError("", {}, orig)
  expected_msg, expected_code = {"message": "SQL issue encountered"}, 500
  actual_msg, actual_code = admin_org.modify_org(admin_org_data.request_json_good)

  assert actual_msg == expected_msg
  assert actual_code == expected_code

# delete_org

@patch('src.admin_org.pgquery.insert_db')
def test_delete_org(mock_insert_db):
  expected_result = {"message": "Organization successfully deleted"}
  actual_result = admin_org.delete_org("test org")

  calls = [
    call(admin_org_data.delete_org_calls[0]),
    call(admin_org_data.delete_org_calls[1]),
    call(admin_org_data.delete_org_calls[2])
    ]
  mock_insert_db.assert_has_calls(calls)
  assert actual_result == expected_result