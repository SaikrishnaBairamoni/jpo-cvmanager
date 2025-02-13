import React, { useEffect, useState } from 'react'
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl'
import mapboxgl from 'mapbox-gl'
import { Container, Col } from 'reactstrap'
import RsuMarker from '../components/RsuMarker'
import mbStyle from '../styles/mb_style.json'
import EnvironmentVars from '../EnvironmentVars'
import dayjs from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import Slider from 'rc-slider'
import Select from 'react-select'
import {
  selectRsuOnlineStatus,
  selectMapList,
  selectRsuData,
  selectRsuCounts,
  selectIssScmsStatusData,
  selectSelectedRsu,
  selectMsgType,
  selectRsuIpv4,
  selectDisplayMap,
  selectHeatMapData,
  selectAddBsmPoint,
  selectBsmStart,
  selectBsmEnd,
  selectBsmDateError,
  selectBsmData,
  selectBsmCoordinates,
  selectBsmFilter,
  selectBsmFilterStep,
  selectBsmFilterOffset,

  // actions
  selectRsu,
  toggleMapDisplay,
  getIssScmsStatus,
  getMapData,
  getRsuLastOnline,
  toggleBsmPointSelect,
  clearBsm,
  updateBsmPoints,
  updateBsmData,
  updateBsmDate,
  setBsmFilter,
  setBsmFilterStep,
  setBsmFilterOffset,
} from '../generalSlices/rsuSlice'
import { selectWzdxData, getWzdxData } from '../generalSlices/wzdxSlice'
import { selectOrganizationName } from '../generalSlices/userSlice'
import {
  selectConfigCoordinates,
  toggleConfigPointSelect,
  selectAddConfigPoint,
  updateConfigPoints,
  geoRsuQuery,
  clearConfig,
} from '../generalSlices/configSlice'
import { useSelector, useDispatch } from 'react-redux'
import ClearIcon from '@mui/icons-material/Clear'
import {
  Button,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Switch,
  TextField,
  ThemeProvider,
  Tooltip,
  createTheme,
} from '@mui/material'

import 'rc-slider/assets/index.css'
import './css/BsmMap.css'
import './css/Map.css'

// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default

const { DateTime } = require('luxon')

function MapPage(props) {
  const dispatch = useDispatch()

  const organization = useSelector(selectOrganizationName)
  const rsuData = useSelector(selectRsuData)
  const rsuCounts = useSelector(selectRsuCounts)
  const selectedRsu = useSelector(selectSelectedRsu)
  const mapList = useSelector(selectMapList)
  const msgType = useSelector(selectMsgType)
  const issScmsStatusData = useSelector(selectIssScmsStatusData)
  const rsuOnlineStatus = useSelector(selectRsuOnlineStatus)
  const rsuIpv4 = useSelector(selectRsuIpv4)
  const displayMap = useSelector(selectDisplayMap)
  const addConfigPoint = useSelector(selectAddConfigPoint)
  const configCoordinates = useSelector(selectConfigCoordinates)

  const heatMapData = useSelector(selectHeatMapData)

  const bsmData = useSelector(selectBsmData)
  const bsmCoordinates = useSelector(selectBsmCoordinates)
  const addBsmPoint = useSelector(selectAddBsmPoint)
  const startBsmDate = useSelector(selectBsmStart)
  const endBsmDate = useSelector(selectBsmEnd)
  const bsmDateError = useSelector(selectBsmDateError)

  const filter = useSelector(selectBsmFilter)
  const filterStep = useSelector(selectBsmFilterStep)
  const filterOffset = useSelector(selectBsmFilterOffset)

  const wzdxData = useSelector(selectWzdxData)

  // Mapbox local state variables
  const [viewState, setViewState] = useState({
    latitude: 39.7392,
    longitude: -104.9903,
    zoom: 10,
  })

  // RSU layer local state variables
  const [selectedRsuCount, setSelectedRsuCount] = useState(null)
  const [displayType, setDisplayType] = useState('')

  const [configPolygonSource, setConfigPolygonSource] = useState({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [],
    },
  })
  const [configPointSource, setConfigPointSource] = useState({
    type: 'FeatureCollection',
    features: [],
  })

  // BSM layer local state variables
  const [bsmPolygonSource, setBsmPolygonSource] = useState({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [],
    },
  })
  const [bsmPointSource, setBsmPointSource] = useState({
    type: 'FeatureCollection',
    features: [],
  })

  const [baseDate, setBaseDate] = useState(new Date(startBsmDate))
  const [startDate, setStartDate] = useState(new Date(baseDate.getTime() + 60000 * filterOffset * filterStep))
  const [endDate, setEndDate] = useState(new Date(startDate.getTime() + 60000 * filterStep))
  const stepOptions = [
    { value: 1, label: '1 minute' },
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '60 minutes' },
  ]

  // WZDx layer local state variables
  const [selectedWZDxMarkerIndex, setSelectedWZDxMarkerIndex] = useState(null)
  const [selectedWZDxMarker, setSelectedWZDxMarker] = useState(null)
  const [wzdxMarkers, setWzdxMarkers] = useState([])
  const [pageOpen, setPageOpen] = useState(true)

  const [activeLayers, setActiveLayers] = useState(['rsu-layer'])

  // useEffects for Mapbox
  useEffect(() => {
    const listener = (e) => {
      if (e.key === 'Escape') {
        dispatch(selectRsu(null))
        setSelectedWZDxMarkerIndex(null)
      }
    }
    window.addEventListener('keydown', listener)

    return () => {
      window.removeEventListener('keydown', listener)
    }
  }, [selectedRsu, dispatch, setSelectedWZDxMarkerIndex])

  // useEffects for RSU layer
  useEffect(() => {
    dispatch(selectRsu(null))
  }, [organization, dispatch])

  // useEffects for BSM layer
  useEffect(() => {
    const localBaseDate = new Date(startBsmDate)
    const localStartDate = new Date(localBaseDate.getTime() + 60000 * filterOffset * filterStep)
    const localEndDate = new Date(new Date(localStartDate).getTime() + 60000 * filterStep)
    setBaseDate(localBaseDate)
    setStartDate(localStartDate)
    setEndDate(localEndDate)
  }, [startBsmDate, filterOffset, filterStep])

  useEffect(() => {
    if (!startBsmDate) {
      dateChanged(new Date(), 'start')
    }
    if (!endBsmDate) {
      dateChanged(new Date(), 'end')
    }
  }, [])

  useEffect(() => {
    if (activeLayers.includes('bsm-layer')) {
      setBsmPolygonSource((prevPolygonSource) => {
        return {
          ...prevPolygonSource,
          geometry: {
            ...prevPolygonSource.geometry,
            coordinates: [[...bsmCoordinates]],
          },
        }
      })

      const pointSourceFeatures = []
      if ((bsmData?.length ?? 0) > 0) {
        for (const [, val] of Object.entries([...bsmData])) {
          const bsmDate = new Date(val['properties']['time'])
          if (bsmDate >= startDate && bsmDate <= endDate) {
            pointSourceFeatures.push(val)
          }
        }
      } else {
        bsmCoordinates.forEach((point) => {
          pointSourceFeatures.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [...point],
            },
          })
        })
      }

      setBsmPointSource((prevPointSource) => {
        return { ...prevPointSource, features: pointSourceFeatures }
      })
    }
  }, [bsmCoordinates, bsmData, startDate, endDate, activeLayers])

  useEffect(() => {
    if (activeLayers.includes('rsu-layer')) {
      setConfigPolygonSource((prevPolygonSource) => {
        return {
          ...prevPolygonSource,
          geometry: {
            ...prevPolygonSource.geometry,
            coordinates: [[...configCoordinates]],
          },
        }
      })
      const pointSourceFeatures = []
      configCoordinates.forEach((point) => {
        pointSourceFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [...point],
          },
        })
      })

      setConfigPointSource((prevPointSource) => {
        return { ...prevPointSource, features: pointSourceFeatures }
      })
    }
  }, [configCoordinates, activeLayers])

  function dateChanged(e, type) {
    try {
      let mst = DateTime.fromISO(e.toISOString())
      mst.setZone('America/Denver')
      dispatch(updateBsmDate({ type, date: mst.toString() }))
    } catch (err) {
      console.error('Encountered issue updating date: ', err.message)
    }
  }

  const addBsmPointToCoordinates = (point) => {
    const pointArray = [point.lng, point.lat]
    if (bsmCoordinates.length > 1) {
      if (bsmCoordinates[0] === bsmCoordinates.slice(-1)[0]) {
        let tmp = [...bsmCoordinates]
        tmp.pop()
        dispatch(updateBsmPoints([...tmp, pointArray, bsmCoordinates[0]]))
      } else {
        dispatch(updateBsmPoints([...bsmCoordinates, pointArray, bsmCoordinates[0]]))
      }
    } else {
      dispatch(updateBsmPoints([...bsmCoordinates, pointArray]))
    }
  }

  const addConfigPointToCoordinates = (point) => {
    const pointArray = [point.lng, point.lat]
    if (configCoordinates?.length > 1) {
      if (configCoordinates[0] === configCoordinates.slice(-1)[0]) {
        let tmp = [...configCoordinates]
        tmp.pop()
        dispatch(updateConfigPoints([...tmp, pointArray, configCoordinates[0]]))
      } else {
        dispatch(updateConfigPoints([...configCoordinates, pointArray, configCoordinates[0]]))
      }
    } else {
      dispatch(updateConfigPoints([...configCoordinates, pointArray]))
    }
  }

  function defaultSlider(val) {
    for (var i = 0; i < stepOptions.length; i++) {
      if (stepOptions[i].value === val) {
        return stepOptions[i].label
      }
    }
  }

  // useEffects for WZDx layers
  useEffect(() => {
    if (selectedWZDxMarkerIndex !== null) setSelectedWZDxMarker(wzdxMarkers[selectedWZDxMarkerIndex])
    else setSelectedWZDxMarker(null)
  }, [selectedWZDxMarkerIndex, wzdxMarkers])

  useEffect(() => {
    function createPopupTable(data) {
      let rows = []
      for (var i = 0; i < data.length; i++) {
        let rowID = `row${i}`
        let cell = []
        for (var idx = 0; idx < 2; idx++) {
          let cellID = `cell${i}-${idx}`
          cell.push(
            <td key={cellID} id={cellID}>
              <pre>{data[i][idx]}</pre>
            </td>
          )
        }
        rows.push(
          <tr key={i} id={rowID}>
            {cell}
          </tr>
        )
      }
      return (
        <div className="container">
          <table id="simple-board">
            <tbody>{rows}</tbody>
          </table>
        </div>
      )
    }

    function getWzdxTable(obj) {
      let arr = []
      arr.push(['road_name', obj['properties']['core_details']['road_names'][0]])
      arr.push(['direction', obj['properties']['core_details']['direction']])
      arr.push(['vehicle_impact', obj['properties']['vehicle_impact']])
      arr.push(['workers_present', obj['properties']['workers_present']])
      arr.push(['description', break_line(obj['properties']['core_details']['description'])])
      arr.push(['start_date', obj['properties']['start_date']])
      arr.push(['end_date', obj['properties']['end_date']])
      return arr
    }

    function openPopup(index) {
      setSelectedWZDxMarkerIndex(index)
      dispatch(selectRsu(null))
    }

    function customMarker(feature, index, lat, lng) {
      return (
        <Marker
          key={feature.id}
          latitude={lat}
          longitude={lng}
          offsetLeft={-30}
          offsetTop={-30}
          feature={feature}
          index={index}
          onClick={(e) => {
            e.originalEvent.stopPropagation()
          }}
        >
          <div onClick={() => openPopup(index)}>
            <img src="./workzone_icon.png" height={60} alt="Work Zone Icon" />
          </div>
        </Marker>
      )
    }

    const getAllMarkers = (wzdxData) => {
      var i = -1
      var markers = wzdxData.features.map((feature) => {
        const localFeature = { ...feature }
        var center_coords_index = Math.round(feature.geometry.coordinates.length / 2)
        var lng = feature.geometry.coordinates[0][0]
        var lat = feature.geometry.coordinates[0][1]
        if (center_coords_index !== 1) {
          lat = feature.geometry.coordinates[center_coords_index][1]
          lng = feature.geometry.coordinates[center_coords_index][0]
        } else {
          lat = (feature.geometry.coordinates[0][1] + feature.geometry.coordinates[1][1]) / 2
          lng = (feature.geometry.coordinates[0][0] + feature.geometry.coordinates[1][0]) / 2
        }
        i++
        localFeature.properties = { ...feature.properties }
        localFeature.properties.table = createPopupTable(getWzdxTable(feature))
        return customMarker(localFeature, i, lat, lng)
      })
      return markers
    }

    setWzdxMarkers(getAllMarkers(wzdxData))
  }, [dispatch, wzdxData])

  const setMapDisplayRsu = async () => {
    let display = !displayMap
    if (display === true) {
      dispatch(getMapData())
    }
    dispatch(toggleMapDisplay())
  }

  function break_line(val) {
    var arr = []
    for (var i = 0; i < val.length; i += 100) {
      arr.push(val.substring(i, i + 100))
    }
    return arr.join('\n')
  }

  function closePopup() {
    setSelectedWZDxMarkerIndex(null)
  }

  function getStops() {
    // populate tmp array with rsuCounts to get max count value
    let max = Math.max(...Object.entries(rsuCounts).map(([, value]) => value.count))
    let stopsArray = [[0, 0.25]]
    let weight = 0.5
    for (let i = 1; i < max; i += 500) {
      stopsArray.push([i, weight])
      weight += 0.25
    }
    return stopsArray
  }

  const layers = [
    {
      id: 'rsu-layer',
      label: 'RSU',
    },
    {
      id: 'heatmap-layer',
      label: 'Heatmap',
      type: 'heatmap',
      maxzoom: 14,
      source: 'heatMapData',
      paint: {
        'heatmap-weight': {
          property: 'count',
          type: 'exponential',
          stops: getStops(),
        },
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0, 10, 1, 13, 2],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(33,102,172,0)',
          0.2,
          'rgb(103,169,207)',
          0.4,
          'rgb(209,229,240)',
          0.6,
          'rgb(253,219,199)',
          0.8,
          'rgb(239,138,98)',
          0.9,
          'rgb(255,201,101)',
        ],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 10, 1, 13, 0.6, 14, 0],
      },
    },
    {
      id: 'bsm-layer',
      label: 'BSM Viewer',
    },
    {
      id: 'wzdx-layer',
      label: 'WZDx',
      type: 'line',
      paint: {
        'line-color': '#F29543',
        'line-width': 8,
      },
    },
  ]

  const Legend = () => {
    const toggleLayer = (id) => {
      if (activeLayers.includes(id)) {
        if (id === 'rsu-layer') {
          dispatch(selectRsu(null))
          setSelectedRsuCount(null)
        } else if (id === 'wzdx-layer') {
          setSelectedWZDxMarkerIndex(null)
        }
        setActiveLayers(activeLayers.filter((layerId) => layerId !== id))
      } else {
        if (id === 'wzdx-layer' && wzdxData.features.length === 0) {
          dispatch(getWzdxData())
        }
        setActiveLayers([...activeLayers, id])
      }
    }

    return (
      <div className="legend">
        <h1 className="legend-header">Map Layers</h1>
        {layers.map((layer) => (
          <div key={layer.id} className="legend-item">
            <label className="legend-label">
              <input
                className="legend-input"
                type="checkbox"
                checked={activeLayers.includes(layer.id)}
                onChange={() => toggleLayer(layer.id)}
              />
              {layer.label}
            </label>
          </div>
        ))}
      </div>
    )
  }

  const isOnline = () => {
    return rsuIpv4 in rsuOnlineStatus && rsuOnlineStatus[rsuIpv4].hasOwnProperty('last_online')
      ? rsuOnlineStatus[rsuIpv4].last_online
      : 'No Data'
  }

  const getStatus = () => {
    return rsuIpv4 in rsuOnlineStatus && rsuOnlineStatus[rsuIpv4].hasOwnProperty('current_status')
      ? rsuOnlineStatus[rsuIpv4].current_status
      : 'Offline'
  }

  const handleScmsStatus = () => {
    dispatch(getIssScmsStatus())
    setDisplayType('scms')
  }

  const handleOnlineStatus = () => {
    setDisplayType('online')
  }

  const handleNoneStatus = () => {
    setDisplayType('')
  }

  const handleRsuDisplayTypeChange = (event) => {
    if (event.target.value === 'online') handleOnlineStatus()
    else if (event.target.value === 'scms') handleScmsStatus()
    else if (event.target.value === 'none') handleNoneStatus()
  }

  const handleButtonToggle = (event, origin) => {
    if (origin === 'config') {
      dispatch(toggleConfigPointSelect())
      if (addBsmPoint) dispatch(toggleBsmPointSelect())
    } else if (origin === 'bsm') {
      dispatch(toggleBsmPointSelect())
      if (addConfigPoint) dispatch(toggleConfigPointSelect())
    }
  }

  return (
    <div className="container">
      <Grid container className="legend-grid" direction="row">
        <Legend />
        {activeLayers.includes('rsu-layer') && (
          <div className="rsu-status-div">
            <h1 className="legend-header">RSU Status</h1>
            <label className="rsu-status-label">
              <input
                className="rsu-status-input"
                type="radio"
                name="none-status-radio"
                value="none"
                checked={displayType === ''}
                onChange={handleRsuDisplayTypeChange}
              />
              None
            </label>

            <label className="rsu-status-label">
              <input
                className="rsu-status-input"
                type="radio"
                name="online-status-radio"
                value="online"
                checked={displayType === 'online'}
                onChange={handleRsuDisplayTypeChange}
              />
              Online Status
            </label>

            <label className="rsu-status-label">
              <input
                className="rsu-status-input"
                type="radio"
                name="scms-status-radio"
                value="scms"
                checked={displayType === 'scms'}
                onChange={handleRsuDisplayTypeChange}
              />
              SCMS Status
            </label>
            <h1 className="legend-header">RSU Configuration</h1>
            <ThemeProvider theme={theme}>
              <FormGroup row className="form-group-row">
                <FormControlLabel
                  control={<Switch checked={addConfigPoint} />}
                  label={'Add Points'}
                  onChange={(e) => handleButtonToggle(e, 'config')}
                />
                {configCoordinates.length > 0 && (
                  <Tooltip title="Clear Points">
                    <IconButton
                      onClick={() => {
                        dispatch(clearConfig())
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </FormGroup>
              <FormGroup row>
                <Button
                  variant="contained"
                  className="contained-button"
                  disabled={!(configCoordinates.length > 2 && addConfigPoint)}
                  onClick={() => {
                    dispatch(geoRsuQuery())
                  }}
                >
                  Configure RSUs
                </Button>
              </FormGroup>
            </ThemeProvider>
          </div>
        )}
        {activeLayers.includes('rsu-layer') && selectedRsu !== null && mapList.includes(rsuIpv4) ? (
          <button
            className="map-button"
            onClick={(e) => {
              setPageOpen(false)
              setTimeout(() => {
                setMapDisplayRsu()
              }, 10)
            }}
          >
            Show Intersection
          </button>
        ) : null}
      </Grid>
      <Container
        fluid={true}
        style={{ width: '100%', height: props.auth ? 'calc(100vh - 136px)' : 'calc(100vh - 100px)', display: 'flex' }}
      >
        <Map
          {...viewState}
          mapboxAccessToken={EnvironmentVars.MAPBOX_TOKEN}
          mapStyle={mbStyle}
          style={{ width: '100%', height: '100%' }}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={(e) => {
            if (addBsmPoint) {
              addBsmPointToCoordinates(e.lngLat)
            }
            if (addConfigPoint) {
              addConfigPointToCoordinates(e.lngLat)
            }
          }}
        >
          {activeLayers.includes('rsu-layer') && (
            <div>
              {configCoordinates?.length > 2 ? (
                <Source id={layers[0].id + '-fill'} type="geojson" data={configPolygonSource}>
                  <Layer {...configOutlineLayer} />
                  <Layer {...configFillLayer} />
                </Source>
              ) : null}
              <Source id={layers[0].id + '-points'} type="geojson" data={configPointSource}>
                <Layer {...configPointLayer} />
              </Source>
            </div>
          )}
          {rsuData?.map(
            (rsu) =>
              activeLayers.includes('rsu-layer') && [
                <Marker
                  className="rsu-marker"
                  key={rsu.id}
                  latitude={rsu.geometry.coordinates[1]}
                  longitude={rsu.geometry.coordinates[0]}
                  onClick={(e) => {
                    e.originalEvent.stopPropagation()
                    dispatch(selectRsu(rsu))
                    setSelectedWZDxMarkerIndex(null)
                    dispatch(getRsuLastOnline(rsu.properties.ipv4_address))
                    dispatch(getIssScmsStatus())
                    if (rsuCounts.hasOwnProperty(rsu.properties.ipv4_address))
                      setSelectedRsuCount(rsuCounts[rsu.properties.ipv4_address].count)
                    else setSelectedRsuCount(0)
                  }}
                >
                  <button
                    className="marker-btn"
                    onClick={(e) => {
                      try {
                        e.originalEvent.stopPropagation()
                      } catch (err) {
                        e.stopPropagation()
                      }
                      dispatch(selectRsu(rsu))
                      setSelectedWZDxMarkerIndex(null)
                      dispatch(getRsuLastOnline(rsu.properties.ipv4_address))
                      dispatch(getIssScmsStatus())
                      if (rsuCounts.hasOwnProperty(rsu.properties.ipv4_address))
                        setSelectedRsuCount(rsuCounts[rsu.properties.ipv4_address].count)
                      else setSelectedRsuCount(0)
                    }}
                  >
                    <RsuMarker
                      displayType={displayType}
                      onlineStatus={
                        rsuOnlineStatus.hasOwnProperty(rsu.properties.ipv4_address)
                          ? rsuOnlineStatus[rsu.properties.ipv4_address].current_status
                          : 'offline'
                      }
                      scmsStatus={
                        issScmsStatusData.hasOwnProperty(rsu.properties.ipv4_address) &&
                        issScmsStatusData[rsu.properties.ipv4_address]
                          ? issScmsStatusData[rsu.properties.ipv4_address].health
                          : '0'
                      }
                    />
                  </button>
                </Marker>,
              ]
          )}
          {activeLayers.includes('heatmap-layer') && (
            <Source id={layers[1].id} type="geojson" data={heatMapData}>
              <Layer {...layers[1]} />
            </Source>
          )}
          {activeLayers.includes('bsm-layer') && (
            <div>
              {bsmCoordinates.length > 2 ? (
                <Source id={layers[2].id + '-fill'} type="geojson" data={bsmPolygonSource}>
                  <Layer {...bsmOutlineLayer} />
                  <Layer {...bsmFillLayer} />
                </Source>
              ) : null}
              <Source id={layers[2].id + '-points'} type="geojson" data={bsmPointSource}>
                <Layer {...bsmPointLayer} />
              </Source>
            </div>
          )}
          {activeLayers.includes('wzdx-layer') && (
            <div>
              {wzdxMarkers}
              <Source id={layers[3].id} type="geojson" data={wzdxData}>
                <Layer {...layers[3]} />
              </Source>
            </div>
          )}
          {selectedWZDxMarker ? (
            <Popup
              latitude={selectedWZDxMarker.props.latitude}
              longitude={selectedWZDxMarker.props.longitude}
              altitude={12}
              onClose={closePopup}
              offsetTop={-25}
              maxWidth={'950px'}
            >
              <div>{selectedWZDxMarker.props.feature.properties.table}</div>
            </Popup>
          ) : null}
          {selectedRsu ? (
            <Popup
              latitude={selectedRsu.geometry.coordinates[1]}
              longitude={selectedRsu.geometry.coordinates[0]}
              onClose={() => {
                if (pageOpen) {
                  console.debug('POPUP CLOSED', pageOpen)
                  dispatch(selectRsu(null))
                  setSelectedRsuCount(null)
                }
              }}
            >
              <div>
                <h2 className="popop-h2">{rsuIpv4}</h2>
                <p className="popop-p">Milepost: {selectedRsu.properties.milepost}</p>
                <p className="popop-p">
                  Serial Number:{' '}
                  {selectedRsu.properties.serial_number ? selectedRsu.properties.serial_number : 'Unknown'}
                </p>
                <p className="popop-p">Manufacturer: {selectedRsu.properties.manufacturer_name}</p>
                <p className="popop-p">RSU Status: {getStatus()}</p>
                <p className="popop-p">Last Online: {isOnline()}</p>
                {rsuIpv4 in issScmsStatusData && issScmsStatusData[rsuIpv4] ? (
                  <div>
                    <p className="popop-p">
                      SCMS Health: {issScmsStatusData[rsuIpv4].health === '1' ? 'Healthy' : 'Unhealthy'}
                    </p>
                    <p className="popop-p">
                      SCMS Expiration:
                      {issScmsStatusData[rsuIpv4].expiration
                        ? issScmsStatusData[rsuIpv4].expiration
                        : 'Never downloaded certificates'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="popop-p">RSU is not enrolled with ISS SCMS</p>
                  </div>
                )}
                <p className="popop-p">
                  {msgType} Counts: {selectedRsuCount}
                </p>
              </div>
            </Popup>
          ) : null}
        </Map>
      </Container>

      {activeLayers.includes('bsm-layer') &&
        (filter ? (
          <div className="filterControl">
            <div id="timeContainer">
              <p id="timeHeader">
                {startDate.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {endDate.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div id="sliderContainer">
              <Slider
                allowCross={false}
                included={false}
                max={(new Date(endBsmDate).getTime() - baseDate.getTime()) / (filterStep * 60000)}
                value={filterOffset}
                onChange={(e) => {
                  dispatch(setBsmFilterOffset(e))
                }}
              />
            </div>
            <div id="controlContainer">
              <Select
                id="stepSelect"
                options={stepOptions}
                defaultValue={filterStep}
                placeholder={defaultSlider(filterStep)}
                onChange={(e) => dispatch(setBsmFilterStep(e.value))}
              />
              <button className="searchButton" onClick={() => dispatch(setBsmFilter(false))}>
                New Search
              </button>
            </div>
          </div>
        ) : (
          <div className="control">
            <div className="buttonContainer">
              <button className={addBsmPoint ? 'selected' : 'button'} onClick={(e) => handleButtonToggle(e, 'bsm')}>
                Add Point
              </button>
              <button
                className="button"
                onClick={(e) => {
                  dispatch(clearBsm())
                }}
              >
                Clear
              </button>
            </div>
            <div className="dateContainer">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Select start date"
                  value={dayjs(startBsmDate === '' ? new Date() : startBsmDate)}
                  maxDateTime={dayjs(endBsmDate === '' ? new Date() : endBsmDate)}
                  onChange={(e) => {
                    dateChanged(e.toDate(), 'start')
                  }}
                  renderInput={(params) => <TextField {...params} />}
                />
              </LocalizationProvider>
            </div>
            <div className="dateContainer">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Select end date"
                  value={dayjs(endBsmDate === '' ? new Date() : endBsmDate)}
                  minDateTime={startBsmDate === '' ? null : dayjs(startBsmDate)}
                  maxDateTime={dayjs(new Date())}
                  onChange={(e) => {
                    dateChanged(e.toDate(), 'end')
                  }}
                  renderInput={(params) => <TextField {...params} />}
                />
              </LocalizationProvider>
            </div>
            <div className="submitContainer">
              <button
                id="submitButton"
                onClick={(e) => {
                  dispatch(updateBsmData())
                }}
              >
                Submit
              </button>
            </div>
            {bsmDateError ? (
              <div id="dateMessage">
                Date ranges longer than 24 hours are not supported due to their large data sets
              </div>
            ) : null}
          </div>
        ))}
    </div>
  )
}

const bsmFillLayer = {
  id: 'bsmFill',
  type: 'fill',
  source: 'polygonSource',
  layout: {},
  paint: {
    'fill-color': '#0080ff',
    'fill-opacity': 0.2,
  },
}

const bsmOutlineLayer = {
  id: 'bsmOutline',
  type: 'line',
  source: 'polygonSource',
  layout: {},
  paint: {
    'line-color': '#000',
    'line-width': 3,
  },
}

const configFillLayer = {
  id: 'configFill',
  type: 'fill',
  source: 'polygonSource',
  layout: {},
  paint: {
    'fill-color': '#0080ff',
    'fill-opacity': 0.2,
  },
}

const configOutlineLayer = {
  id: 'configOutline',
  type: 'line',
  source: 'polygonSource',
  layout: {},
  paint: {
    'line-color': '#000',
    'line-width': 3,
  },
}

const configPointLayer = {
  id: 'configPointLayer',
  type: 'circle',
  source: 'pointSource',
  paint: {
    'circle-radius': 5,
    'circle-color': 'rgb(255, 0, 0)',
  },
}
const bsmPointLayer = {
  id: 'bsmPointLayer',
  type: 'circle',
  source: 'pointSource',
  paint: {
    'circle-radius': 5,
    'circle-color': 'rgb(255, 164, 0)',
  },
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#d16d15',
      light: '#0e2052',
      contrastTextColor: '#0e2052',
    },
    secondary: {
      main: '#d16d15',
      light: '#0e2052',
      contrastTextColor: '#0e2052',
    },
    text: {
      primary: '#ffffff',
      secondary: '#ffffff',
      disabled: '#ffffff',
      hint: '#ffffff',
    },
    action: {
      disabledBackground: 'rgba(209, 109, 21, 0.2)',
      disabled: '#ffffff',
    },
  },
  components: {
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: '#d16d15',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          borderRadius: 15,
        },
      },
    },
  },
  input: {
    color: '#11ff00',
  },
  typography: {
    allVariants: {
      color: '#ffffff',
    },
    button: {
      textTransform: 'none',
    },
  },
})

export default MapPage
