Jpo-ode:

Version 1.5.0, released Nov 15th 2023
----------------------------------------

### **Summary**
The updates for the jpo-ode 1.5.0 release include CI configuration fixes, README updates and updated submodule references.

Enhancements in this release:
- Added README note for Windows users on the shared volume environment variable.
- Updated submodule references
- The supported operating systems in the README have been updated to more recent versions.
- Updated all references to the test package from org.junit.Test to org.junit.jupiter.api.Test. Some tests are also updated to remove deprecated annotations.
- Introduced changes that enable the ODE to establish communication with RSUs using both the NTCIP1218 protocol and the 4.1 DSRC protocol.

Fixes in this release:
- Fixed CI configuration command parameters.

Known Issues
- No known issues at this time.


Jpo-cvdp:

Version 1.2.0, released Nov 15th 2023
----------------------------------------

### **Summary**
The changes for the jpo-cvdp 1.2.0 release involve the addition of CI/CD configuration, a new build.sh script, an updated catch dependency, modified sonar properties, adjusted unit tests for accuracy, standardized logging level strings to uppercase and fixes for the `do_kafka_test.sh` script.

Enhancements in this release:
- Added CI/CD configuration
- Added `build.sh` script
- Updated catch dependency
- Modified sonar properties.
- Modified a unit test to use reasonable accuracy.
- Standardized logging level strings to uppercase.
- Changed default logging level to ‘ERROR’ instead of ‘TRACE’
- Directly accessed PPM_LOG_LEVEL in PpmLogger class instead of using ‘v’ opt string.
- Set PPM_LOG_LEVEL to DEBUG in `standalone.sh` and `standalone_multi.sh` scripts

Fixes in this release:
- Fixed the `do_kafka_test.sh` script
- Removed `docker-from-docker` feature from .devcontainer spec
- Replaced instances of `chmod 7777` in dockerfiles with `chmod 777`h communication with RSUs using both the NTCIP1218 protocol and the 4.1 DSRC protocol.

Known Issues
- The `do_kafka_test.sh` script in the root directory of the project is currently not running successfully.







Asn1_codec:

Version 1.5.0, released Nov 15th 2023
----------------------------------------

### **Summary**

The changes for the asn1_codec 1.5.0 include improved compatibility, a new build script, enhanced code analysis, uniform logging levels, auto-restart for Docker-compose, a default logging level change, and graceful shutdown for ACM in response to errors.

Enhancements in this release:
- The catch dependency has been updated to a more recent version to ensure compatibility and reliability.
- Added `build.sh script`
- A new sonar configuration has been included to enhance code analysis capabilities.
- The logging level strings have been converted to uppercase to match those in other submodules.
- Docker-compose.yml files have been modified to automatically restart in case of failure.

Fixes in this release:
- The default logging level has been changed from TRACE to ERROR.
- ACM will now gracefully shut down when it encounters a transport error or an unrecognized Kafka error.
  
Known Issues:
- The do_kafka_test.sh script in the project's root directory is currently not running successfully. The issue is being investigated and will be addressed in a future update.
- According to Valgrind, a minor memory leak has been detected. The development team is aware of this and is actively working on resolving it.




S3_depositor:

Version 1.3.0, released Nov 15th 2023
----------------------------------------

### **Summary**

The updates for the jpo-s3-deposit 1.3.0 release consist of fixed GitHub workflow job names and adjustments to the run.sh script to reference the correct JAR file.

Enhancements in this release:
- The run.sh script has been modified to point to the accurate JAR file.

Fixes in this release:
- Fixed github workflow job names.
  
Known Issues
- No known issues at this time.



Sdw_depositor:

Version 1.5.0, released Nov 15th 2023
----------------------------------------

### **Summary**

The updates for the jpo-sdw-depositor 1.5.0 involve correcting the default SDX URL, fixing failing unit tests, and addressing a key reference issue in KafkaConsumerRestDepositor.java.

Enhancements in this release:
- Addressed and updated a key reference issue in KafkaConsumerRestDepositor.java.
  
Fixes in this release:
- Resolved failing unit tests.
- The default SDX URL has been corrected.
- Renamed mocked variables in DepositControllerTest.java

Known Issues
- No known issues at this time.













































## JPO CV Manager Release Notes

## Version 1.0.0

### **Summary**

The first release for the jpo-cvmanager, version 1.0.0, includes an operational web application frontend with a backend API that supports Google OAuth authentication. Using the CV Manager, a user will be able to manage their deployed CV RSUs through an interactive, graphical user interface using Mapbox. This includes the main map menu (for viewing device statuses, configuring SNMP message forwarding, and visualizing BSMs and WZDx data), an administration menu (for adding, removing and modifying device information), and a help menu. Additional deployments are bundled with the CV Manager repository to get a user started with the PostgreSQL database and collecting RSU online status from a Zabbix server. Read more about the jpo-cvmanager in the [main README](../README.md).

Enhancements in this release:

- PR6: Add addon microservices that allow the CV Manager to display useful metrics for CV environments. (count_metric, rsu_ping_fetch and bsm_query)
- PR5: Introduce unit tests for the React web application.
- PR4: Integrate the RSU configuration menu into the main map menu using geo-fences for multi-RSU configurations.
- PR3: Create a local PostgreSQL solution to remove the dependency of GCP Cloud SQL from the API.
- PR2: Combines the map page, configuration page, heatmap, BSM visualization and WZDx page into a single page for streamlining the user experience.
- PR1: Initial CV Manager application and API developed by CDOT. Includes Mapbox mapping solution, configuration page, admin page, and Google OAuth2.0 support for user authentication.
