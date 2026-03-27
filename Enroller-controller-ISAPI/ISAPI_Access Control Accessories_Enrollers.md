

Hikvision co MMC
adil@hikvision.co.az

About this Document
## Trademarks Acknowledgment
All trademarks and logos mentioned are the properties of their respective owners.
## LEGAL DISCLAIMER
This Document includes instructions for using and managing the Product. Pictures, charts, images and all other
information hereinafter are for description and explanation only. Unless otherwise agreed, our company makes no
warranties, express or implied.
Please use this Document with the guidance and assistance of professionals trained in supporting the Product.
TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THIS DOCUMENT AND THE PRODUCT DESCRIBED,
WITH ITS HARDWARE, SOFTWARE AND FIRMWARE, ARE PROVIDED "AS IS" AND "WITH ALL FAULTS AND
ERRORS". OUR COMPANY MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION,
MERCHANTABILITY, SATISFACTORY QUALITY, OR FITNESS FOR A PARTICULAR PURPOSE. THE USE OF THE
PRODUCT BY YOU IS AT YOUR OWN RISK. IN NO EVENT WILL OUR COMPANY BE LIABLE TO YOU FOR ANY
SPECIAL, CONSEQUENTIAL, INCIDENTAL, OR INDIRECT DAMAGES, INCLUDING, AMONG OTHERS, DAMAGES FOR
LOSS OF BUSINESS PROFITS, BUSINESS INTERRUPTION, OR LOSS OF DATA, CORRUPTION OF SYSTEMS, OR
LOSS OF DOCUMENTATION, WHETHER BASED ON BREACH OF CONTRACT, TORT (INCLUDING NEGLIGENCE),
PRODUCT LIABILITY, OR OTHERWISE, IN CONNECTION WITH THE USE OF THE PRODUCT, EVEN IF OUR
## COMPANY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES OR LOSS.
YOU ACKNOWLEDGE THAT THE NATURE OF THE INTERNET PROVIDES FOR INHERENT SECURITY RISKS, AND
OUR COMPANY SHALL NOT TAKE ANY RESPONSIBILITIES FOR ABNORMAL OPERATION, PRIVACY LEAKAGE OR
OTHER DAMAGES RESULTING FROM CYBER-ATTACK, HACKER ATTACK, VIRUS INFECTION, OR OTHER INTERNET
SECURITY RISKS; HOWEVER, OUR COMPANY WILL PROVIDE TIMELY TECHNICAL SUPPORT IF REQUIRED.
YOU AGREE TO USE THIS PRODUCT IN COMPLIANCE WITH ALL APPLICABLE LAWS, AND YOU ARE SOLELY
RESPONSIBLE FOR ENSURING THAT YOUR USE CONFORMS TO THE APPLICABLE LAW. ESPECIALLY, YOU ARE
RESPONSIBLE, FOR USING THIS PRODUCT IN A MANNER THAT DOES NOT INFRINGE ON THE RIGHTS OF THIRD
PARTIES, INCLUDING WITHOUT LIMITATION, RIGHTS OF PUBLICITY, INTELLECTUAL PROPERTY RIGHTS, OR DATA
PROTECTION AND OTHER PRIVACY RIGHTS. YOU SHALL NOT USE THIS PRODUCT FOR ANY PROHIBITED END-
USES, INCLUDING THE DEVELOPMENT OR PRODUCTION OF WEAPONS OF MASS DESTRUCTION, THE
DEVELOPMENT OR PRODUCTION OF CHEMICAL OR BIOLOGICAL WEAPONS, ANY ACTIVITIES IN THE CONTEXT
RELATED TO ANY NUCLEAR EXPLOSIVE OR UNSAFE NUCLEAR FUEL-CYCLE, OR IN SUPPORT OF HUMAN RIGHTS
## ABUSES.
IN THE EVENT OF ANY CONFLICTS BETWEEN THIS DOCUMENT AND THE APPLICABLE LAW, THE LATTER
## PREVAILS.
Hikvision co MMC
adil@hikvision.co.az

ChapterDescription
## Overview
Includes the ISAPI overview, applicable products, terms and definitions, abbreviations, and update
history.
## ISAPI
## Framework
Read the chapter to take a quick look at the ISAPI framework and basic functions.
## Quick Start
## Guide
Read the chapter to quickly understand the programming process of basic functions such as
authentication, message parsing, real-time live view, playback, and event uploading.
## API
## Reference
Start programming according to API definitions.
How-To
## Video
## Guidance
How-to videos demonstrate detailed steps of different integration tasks.
Intelligent Security API (hereinafter referred to as ISAPI) is an application layer protocol based on HTTP (Hypertext
Transfer Protocol) and adopts the REST (Representational State Transfer) architecture for communication between
security devices (cameras, DVRs, NVRs, etc.) and the platform or client software.
Since established in 2013, ISAPI has included more than 11,000 APIs for different functions, including device
management, vehicle recognition, parking lot management, intelligent facial application, access control management,
interrogation management, and recording management. It is applicable to industries such as traffic, fire protection,
education, and security inspection.
When you integrate devices via ISAPI, the device acts as the server to listen on the fixed port and the user's application
acts as the client to actively log in to the device for communication. To achieve the above goals, the device should be
configured with a fixed IP address and the requests from the client can reach the server.
## 1 Reading Guide
## 2 Overview
## 2.1 Introduction
## 2.1.1 Application Scenario
Hikvision co MMC
adil@hikvision.co.az

ISAPI is an application layer protocol based on HTTP, thereby it inherits all specifications and properties from HTTP.
Protocols frequently used along with ISAPI include SADP (Search Active Device Protocol) based on multicast for
discovering and activating devices, RTSP (Real-Time Streaming Protocol) based on TCP/UDP for live view and video
playback of devices, etc.
Logs generated during the operation of the device's firmware. These logs are recorded in log files or log systems in text
format, and are primarily used by device developers and maintenance personnel to identify device issues. #
Event refers to the information uploaded by the device actively. Event needs to be uploaded by the device in real time
for the immediate response from the platform. If the device is offline, the event can be stored in the cache first and then
be uploaded again when the connection is restored.
Arming means that the client establishes connection with the device so that events can be uploaded to the client via the
connection. The client can subscribe to some event types, and the device will upload the specified events only,
otherwise the device will upload all types of events to the client.
admin: administrator
HC: Connect Mobile Client
HPP: Partner Pro
HTTP: Hypertext Transfer Protocol.
No update record
2.1.2 Layers in the Network Model
## 2.2 Product Scope
## Access Control Accessories
## Enrollers
## DS-K1F510-P, DS-K1F600-D6E, DS-K1F600-D6E-F, DS-K1F600U-D6E, DS-K1F600U-D6E-F
## 2.3 Terms And Definitions
## 2.3.2 Device Operation Log
## 2.3.3 Event
## 2.3.4 Arming
## 2.4 Symbols And Acronyms
## 2.5 Update History
Hikvision co MMC
adil@hikvision.co.az

## Notes:
In general, ISAPI refers to the communication protocol based on the HTTP standard. As ISAPI is usually used along with
RTSP (Real-Time Streaming Protocol), the RTSP standard is brought into the ISAPI system.
The metadata scheme for transmitting additional information of the stream is extended based on the RTSP standard to
transmit the video stream and the structured intelligent information of the stream simultaneously. It is compatible with
the RTSP standard.
The purpose of activation is to ensure that the user can set the password for the device and the password meets the
security requirement. After the device is activated, you can use the related functions.
ISAPI is a communication protocol running on the application layer. When activating the device via ISAPI, you should
know the device's IP address and make sure that the device is connected to the client.
The web application built in the device supports activating the device via ISAPI. When you enter the device's IP address
in the address bar of the web browser on the PC, you can activate the device according to the activation guide.
If you want to activate the device on your own application, you need to integrate the activation function via ISAPI. The
API calling flow and related APIs are shown below.
3 ISAPI Framework
## 3.1 Overview
## 3.2 Activation
Hikvision co MMC
adil@hikvision.co.az

Firstly, two operations are defined:
bytesToHexstring: it is used to convert a byte array (the length is N) to a hexadecimal string (the length is 2N). For
example, 127,10,23 -> 7f0a17
hexStringToBytes: it is used to convert a hexadecimal string (the length is 2N) to a byte array (the length is N). For
example, 7f0a17 -> 127,10,23
- The client generates a public and private key pair (1024 bits), and gets the 128-byte modulus in the public key
(hereinafter referred to as public key modulus). If the length is longer than 128, the leading 0 needs to be removed.
- The client converts the public key modulus to a 256-byte public key string via bytesToHexstring and sends the
public key string to the device in XML message (related URI: POST /ISAPI/Security/challenge) after being
encoded by Base64.
- The device parses the request to obtain a 256-byte public key string decoded by Base64 and converts it to a 128-
byte public key modulus via hexStringToBytes. The complete public key is the combination of obtained public key
modulus and public exponent (the default value is '010001').
- The device generates a 32-byte hexadecimal random string, calls the RSA API to encrypt the random string with
the private key, converts the encrypted data to a string via bytesToHexstring, encodes the string by Base64, and
then sends it to the client.
- The client decodes the string from the device by Base64, converts it via hexStringToBytes to get the encrypted data,
decrypts the encrypted data with the private key via RSA to obtain a 32-byte hexadecimal random string, converts
the obtained string via hexStringToBytes to get a 16-byte AES key. Then the client uses the AES key to encrypt the
"string consisting of the first 16 characters of the random string and the real password" by AES128
ECB mode (with zero-padding method) to get a ciphertext, and converts the ciphertext via bytesToHexstring,
encodes it by Base64, and sends it to the device in XML message (related URI: PUT /ISAPI/System/activate).
Note: If the first 16 characters of the random string are aaaabbbbccccdddd and the real password is Abc12345, the
data before encryption is aaaabbbbccccddddAbc12345. This can ensure that the client uses the random string as the
key for encryption.
- The device decodes the string by Base64, converts it via hexStringToBytes to get the ciphertext, uses the AES key to
decrypt the ciphertext by AES128 ECB mode, and gets the real password via removing the first 16 characters.
Hikvision co MMC
adil@hikvision.co.az

## Notes:
When the client applications send requests to devices, they need to use digest authentication (see details in RFC 7616)
for identity authentication.
Currently, all mainstream request class libraries of HTTP have encapsulated digest authentication. See details in
Authentication of Quick Start Guide.
There are three kinds of users with different permissions for access control and management.
Administrator: Has the permission to access all supported resources and should keep activated all the time. It is also
known as "admin".
Operator: Has the permission to access general resources and a part of advanced resources.
Normal User: Only has the permission to access general resources.
During ISAPI integration, the HTTPS service of devices is enabled by default. When the client applications communicate
with devices via HTTPS, the information can be transmitted securely.
When the client applications send requests to the devices, they need to use digest authentication (see details in RFC
7616) for identity authentication.
Client applications only need to call APIs of the class library to implement the digest authentication. The sample code is
shown below.
- The device verifies the password and returns the activation result.
You can get the device's activation status by calling the URI GET /SDK/activateStatus which requires no
authentication.
Devices also support to be activated via SADP (Search Active Device Protocol) which is based on the
communication protocol of the data link layer. With SADP, you do not have to know the IP address of the device
but need to ensure that the device and the application running SADP are connected to the same router. SADP also
supports discovering devices in the LAN, changing the password of the devices, and so on. The HCSadpSDK is
provided for SADP integration, including the developer guide, plug-in, and sample demo which can be used as a
simple SADP tool.
## 3.3 Security Mechanism
## 3.3.1 Authentication
## 3.3.2 User Permission
## 3.3.3 Information Encryption
## 4 Quick Start Guide
## 4.1 Authentication
4.1.1 C/C++ (libcurl)
Hikvision co MMC
adil@hikvision.co.az

## // #include <curl/curl.h>
## // Callback Function
static size_t OnWriteData(void* buffer, size_t size, size_t nmemb, void* lpVoid)
## {
std::string* str = dynamic_cast<std::string*>((std::string *)lpVoid);
if( NULL == str || NULL == buffer )
## {
return -1;
## }
char* pData = (char*)buffer;
str->append(pData, size * nmemb);
return nmemb;
## }
std::string strUrl = "http://192.168.18.84:80/ISAPI/System/deviceInfo";
std::string strResponseData;
CURL *pCurlHandle = curl_easy_init();
curl_easy_setopt(pCurlHandle, CURLOPT_CUSTOMREQUEST, "GET");
curl_easy_setopt(pCurlHandle, CURLOPT_URL, strUrl.c_str());
// Set the user name and password
curl_easy_setopt(pCurlHandle, CURLOPT_USERPWD, "admin:admin12345");
// Set the authentication method to the digest authentication
curl_easy_setopt(pCurlHandle, CURLOPT_HTTPAUTH, CURLAUTH_DIGEST);
// Set the callback function
curl_easy_setopt(pCurlHandle, CURLOPT_WRITEFUNCTION, OnWriteData);
// Set the parameters of the callback function to get the returned information
curl_easy_setopt(pCurlHandle, CURLOPT_WRITEDATA, &strResponseData);
// Timeout settings for receiving the data. If receiving data is not completed within 5 seconds, the application will exit directly
curl_easy_setopt(pCurlHandle, CURLOPT_TIMEOUT, 5);
// Set the redirection times to avoid too many redirections
curl_easy_setopt(pCurlHandle, CURLOPT_MAXREDIRS, 1);
// Connection timeout duration. If the duration is too short, the client application will be disconnected before the data request sent by the application
reaches the device
curl_easy_setopt(pCurlHandle, CURLOPT_CONNECTTIMEOUT, 5);
CURLcode nRet = curl_easy_perform(pCurlHandle);
if (0 == nRet)
## {
// Output the received message
std::cout << strResponseData << std::endl;
## }
curl_easy_cleanup(pCurlHandle);
// using System.Net;
// using System.Net.Security;
try
## {
string strUrl = "http://192.168.18.84:80/ISAPI/System/deviceInfo";
WebClient client = new WebClient();
// Set the user name and password
client.Credentials = new NetworkCredential("admin", "admin12345");
byte[] responseData = client.DownloadData(strUrl);
string strResponseData = Encoding.UTF8.GetString(responseData);
// Set the user name and password
Console.WriteLine(strResponseData);
## }
catch (Exception ex)
## {
Console.WriteLine(ex.Message);
## }
// import org.apache.commons.httpclient.HttpClient;
String url = "http://192.168.18.84:80/ISAPI/System/deviceInfo";
HttpClient client = new HttpClient();
// Set the user name and password
UsernamePasswordCredentials creds = new UsernamePasswordCredentials("admin", "admin12345");
client.getState().setCredentials(AuthScope.ANY, creds);
GetMethod method = new GetMethod(url);
method.setDoAuthentication(true);
int statusCode = client.executeMethod(method);
byte[] responseData = method.getResponseBodyAsString().getBytes(method.getResponseCharSet());
String strResponseData = new String(responseData, "utf-8");
method.releaseConnection();
// Output received information
System.out.println(strResponseData);
4.1.2 C# (WebClient)
4.1.3 Java (HttpClient)
## 4.1.4 Python (requests)
Hikvision co MMC
adil@hikvision.co.az

# - *- coding: utf-8 -*-
import requests
request_url = 'http://192.168.18.84:80/ISAPI/System/deviceInfo'
# Set the authentication information
auth = requests.auth.HTTPDigestAuth('admin', 'admin12345')
# Send the request and receive response
response = requests.get(request_url, auth=auth)
# Output response content
print(response.text)
During the process of communication and interaction via ISAPI, the request and response messages are often text data
in XML or JSON format. Besides that, the data of firmware packages and configuration files is in binary format. A
request can also be in form format with multiple formats of data (multipart/form-data).
Generally, the Content-Type in the headers of the HTTP request is application/xml; charset="UTF-8"
Request and response messages in XML format are all encoded with UTF-8 standards in ISAPI.
The namespaces http://www.isapi.org/ver20/XMLSchema and ISAPI version number 2.0 of XML messages are
configured by default, see the example below.
<?xml version="1.0" encoding="UTF-8"?>
<NodeList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<Node>
## <id>1</id>
## <enabled>true</enabled>
<nodeName>nodeName</nodeName>
## <level>level1</level>
</Node>
</NodeList>
The Content-Type in the headers of the HTTP request is often application/json.
To distinguish between APIs with XML messages and those with JSON messages, ISAPI adds the query parameter
format=json to all request URLs with JSON messages, e.g.,
http://192.168.1.1:80/ISAPI/System/Sensor/thermometrySensor?format=json . Messages of request URLs without
the query parameter format=json are usually in XML format. However, there may be some exceptions, and the message
format is subject to the API definition.
Request and response messages in JSON format are all encoded by UTF-8 in ISAPI.
For the firmware and configuration files, the Content-Type in the header of an HTTP request is often
application/octet-stream.
When multiple pieces of data are submitted at the same time in an ISAPI request (e.g., the person information and face
picture need to be submitted at the same time when a face record is added to the face picture library), the Content-
Type in the header of the corresponding HTTP request is usually multipart/form-data, boundary=AaB03x, where the
boundary is a variable used to separate the entire HTTP body into multiple units and each unit is a piece of data with its
own headers and body. In Content-Disposition of form unit headers, the name property refers to the form unit name,
which is required for all form units; the filename property refers to the file name of form unit body, which is required
only when the form unit body is a file. In form unit headers, Content-Length refers to the body length, which starts
after the CRLF(\r\n) and ends before two hyphens (--) of next form. There should be a CRLF used as the delimiter of
two form units before two hyphens (--), and the Content-Length of previous form unit does not include the CRLF
## 4.2 Message Parsing
## 4.2.1 Message Format
## 4.2.1.1 XML
## 4.2.1.2 JSON
## 4.2.1.3 Binary Data
## 4.2.1.4 Form (multipart/form-data)
Hikvision co MMC
adil@hikvision.co.az

length. For the detailed format description, refer to RFC 1867 (Form-Based File Upload in HTML). Pay attention to two
hyphens (--) before and after the boundary.
## Notes
The example of ISAPI form data submitted by a client to a device is as follows.
POST /ISAPI/Intelligent/FDLib/pictureUpload
Content-Type: multipart/form-data; boundary=e5c2f8c5461142aea117791dade6414d
Content-Length: 56789
## --e5c2f8c5461142aea117791dade6414d
Content-Disposition: form-data; name="PictureUploadData";
Content-Type: application/xml
Content-Length: 1234
<PictureUploadData/>
## --e5c2f8c5461142aea117791dade6414d
Content-Disposition: form-data; name="face_picture"; filename="face_picture.jpg";
Content-Type: image/jpeg
Content-Length: 34567
## Picture Data
## --e5c2f8c5461142aea117791dade6414d--
The example of ISAPI form data responded by a device to a client is as follows.
In ISAPI messages, when there are multiple form units, three nodes (pid, contentid, and filename) are used for linking
form units. The corresponding relations are as follows:
## Node
## Name
## Form
## Field
## Description
pidname
pid in XML/JSON messages corresponds to the name property of Content-Disposition in
form headers.
contentid
## Content-
## ID
contentid in XML/JSON messages corresponds to Content-ID in form headers.
filenamefilename
filename in XML/JSON messages corresponds to filename property of Content-Disposition in
form headers.
In RFC specifications, it is strongly recommended to contain the field Content-Length in the entity header, and
there is no requirement that the field Content-Length should be contained in the header of each form element.
The absence of field Content-Length in the header should be considered when the client and device programs
parse the form data.
To avoid the conflict between message content and boundary value, it is recommended to use a longer and more
complex string as the boundary value.
Hikvision co MMC
adil@hikvision.co.az

## HTTP/1.1 200 OK
Content-Type: multipart/form-data; boundary=136a73438ecc4618834b999409d05bb9
Content-Length: 56789
## --136a73438ecc4618834b999409d05bb9
Content-Disposition: form-data; name="mixedTargetDetection";
Content-Type: application/json
Content-Length: 811
## {
"ipAddress": "172.6.64.7",
"macAddress": "01:17:24:45:D9:F4",
"channelID": 1,
"dateTime": "2009-11-14T15:27+08:00",
"eventType": "mixedTargetDetection",
"eventDescription": "Mixed target detection",
"deviceID": "123456789",
"CaptureResult": [{
"targetID": 1,
"Human": {
"Rect": {
## "height": 1.0,
## "width": 1.0,
## "x": 0.0,
## "y": 0.0
## },
"contentID1": "humanImage", /*human body thumbnail*/
"contentID2": "humanBackgroundImage", /*human body background picture*/
"pId1": "9d48a26f7b8b4f2390c16808f93f3534", /*human body thumbnail ID */
"pId2": "5EE7078E07BB47CF860DE8E4E9A85F28" /*ID of human body background picture*/
## }
## }]
## }
## --136a73438ecc4618834b999409d05bb9
Content-Disposition: form-data; name="9d48a26f7b8b4f2390c16808f93f3534"; filename="humanImage.jpg";
Content-Type: image/jpeg
Content-Length: 34567
Content-ID: humanImage
## Picture Data
## --136a73438ecc4618834b999409d05bb9
Content-Disposition: form-data; name="5EE7078E07BB47CF860DE8E4E9A85F28"; filename="humanBackgroundImage.jpg";
Content-Type: image/jpeg
Content-Length: 345678
Content-ID: humanBackgroundImage
## Picture Data
## --136a73438ecc4618834b999409d05bb9--
The field descriptions of ISAPI request and response messages are marked as annotations in the example messages as
shown below.
<?xml version="1.0" encoding="UTF-8"?>
<NodeList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, node list, attr:version{req, string, version No., range:[,]}-->
<Node>
<!--ro, opt, object, node information-->
## <id>
<!--ro, req, int, node No., range:[,], step:, unit:, unitType:-->1
## </id>
## <enabled>
<!--ro, opt, bool, whether to enable-->true
## </enabled>
<nodeName>
<!--ro, req, string, node name, range:[1,32]-->test
</nodeName>
## <level>
<!--ro, opt, enum, level, subType:string,
## [level1#level 1,level2#level 2,level3#level 3]-->level1
## </level>
</Node>
</NodeList>
## 4.2.2 Annotation
Hikvision co MMC
adil@hikvision.co.az

## {
## "name":  "test",
/*ro, req, string, name, range:[1,32]*/
## "type":  "type1",
/*ro, req, enum, type, subType:string, [type1#type 1,type2#type 2]*/
"enabled":  true,
/*ro, opt, bool, enable or not, desc:xxxxxxx*/
"NodeList": {
/*opt, object, node list, dep:and,{$.enabled,eq,true}*/
## "scene":  1,
/*req, enum, scene, subType:int, [1#scene 1,2#scene 2,3#scene 3]*/
## "ID":  1
/*req, int, No., range:[1,8], step:, unit:, unitType:*/
## }
## }
Key annotations are shown in the table below.
AnnotationDescriptionRemark
ro
## Attribute: Read-
## Only
This field can only be obtained and cannot be edited.
wo
## Attribute: Write-
## Only
This field can only be edited and cannot be obtained.
req
## Attribute:
## Required
This field is required for request messages sent to the device and response
messages returned from the device.
opt
## Attribute:
## Optional
This field is optional for request messages sent to the device and response
messages returned from the device.
dep
## Attribute:
## Dependent
This field is valid and required when specific conditions are satisfied.
objectField Type: ObjectThe field of type object contains multiple sub-fields.
listField Type: ListThe subType following it refers to the data type of sub-items in the list.
subTypeField Type: String
The range following it refers to the maximum and the minimum string size of the
field.
intField Type: IntThe range following it refers to the maximum and the minimum value of the field.
floatField Type: FloatThe range following it refers to the maximum and the minimum value of the field.
bool
## Field Type:
## Boolean
The value can be true or false.
enum
## Field Type:
## Enumeration
The subType following it indicates that the enumerators are of type string or int.
The [] following the subType contains all enumerators.
subTypeSub-Type of Field
When the type of field is list or enum, the value of subType is the data type of each
sub-object.
descField DescriptionThe detailed description of the field.
ISAPI has designed capability sets for almost all functions, APIs, and fields. URLs for getting the capability set end with
/capabilities. Some URLs may contain query parameters in the format: /capabilities?format=json&type=xxx.
There are two types of fields in the capability message of ISAPI: whether the device supports a function and the value
range of a field in an API.
Whether the device supports a function: it is often in the format isSupportXxxxxxxx, which indicates that whether
the device supports a function and a set of APIs for implementing this function.
The capability message example in JSON format is shown below:
## 4.2.3 Capability Set
Hikvision co MMC
adil@hikvision.co.az

## {
"isSupportMap":  true,
/*ro, opt, bool, whether it supports the e-map function, desc:/ISAPI/SDT/Management/map/capabilities?format=json*/
"isSupportAlgTrainResourceInfo":  true,
/*ro, opt, bool, whether it supports only getting the resource information of the algorithm training platform,
desc:/ISAPI/SDT/algorithmTraining/ResourceInfo?format=json*/
"isSupportAlgTrainAuthInfo":  true,
/*ro, opt, bool, whether it supports ony getting the authorization information of the algorithm training platform,
desc:/ISAPI/SDT/algorithmTraining/SoftLock/AuthInfo?format=json*/
"isSupportAlgTrainNodeList":  true,
/*ro, opt, bool, whether it supports only getting the node information of the algorithm training platform, desc:/ISAPI/SDT/algorithmTraining/NodeList?
format=json*/
"isSupportNAS":  true
/*ro, opt, bool, whether it supports mounting and unmounting NAS, desc:/ISAPI/SDT/Management/NAS/capabilities?format=json*/
## }
The capability message example in XML format is shown below:
<isSupportNetworkStatus>
<!--ro, opt, bool, whether it supports searching the network status, desc: related API (/ISAPI/System/Network/status?format=json)-->true
</isSupportNetworkStatus>
The value range of the field: the maximum value, minimum value, the maximum size, the minimum size, options,
and so on of each field of the API.
The example of JSON format is shown below:
## {
"boolType": {
/*req, object, example of the capability of type bool*/
"@opt": [true, false]
/*req, array, options, subType: bool*/
## },
"integerType": {
/*req, object, example of the capability of type integer*/
## "@min": 0,
/*ro, req, int, the minimum value*/
## "@max": 100
/*ro, req, int, the maximum value*/
## },
"stringType": {
/*req, object, example of the capability of type string*/
## "@min": 0,
/*ro, req, int, the minimum string size*/
## "@max": 32
/*ro, req, int, the maximum string size*/
## },
"enumType": {
/*req, object, capability example of type enum*/
## "@opt": ["enum1", "enum2", "enum3"]
/*req, array, options, subType: string*/
## }
## }
The example of XML format is shown below:
<boolType opt="true,false" def="true">
<!--ro, opt, bool, example of the capability of type bool-->true
</boolType>
<integerType min="0" max="100">
<!--ro, opt, int, example of the capability of type int-->50
</integerType>
<stringType min="0" max="64">
<!--ro, opt, string, example of the capability of type string-->test
</stringType>
<enumType opt="red,white,black" def="red">
<!--ro, opt, string, example of the capability of type enum-->white
</enumType>
Note: For the same capability set, devices of different models and versions may return different results. The values
shown in this document are only examples for reference. The capability set actually returned by the device takes
precedence.
ISAPI adopts ISO 8601 Standard Time Format, which is the same as W3C Standard Date and Time Formats.
## 4.2.4 Time Format
Hikvision co MMC
adil@hikvision.co.az

Format: YYYY-MM-DDThh:mm:ss.sTZD
YYYY = the year consisting of four decimal digits
MM = the month consisting of two decimal digits (01-January, 02-February, and so forth)
DD = the day consisting of two decimal digits (01 to 31)
hh = the hour consisting of two decimal digits (00 to 23, a.m. and p.m. are not allowed)
mm = the minute consisting of two decimal digits (00 to 59)
ss = the second consisting of two decimal digits (00 to 59)
s = one or more digits representing the fractional part of a second
TZD = time zone identifier (Z or +hh:mm or -hh:mm)
Example: 2017-08-16T20:17:06.123+08:00 refers to 20:17:06.123 on August 16, 2017 (local time which is 8 hours
ahead of UTC). The plus sign (+) indicates that the local time is ahead of UTC, and the minus sign (-) means that the
local time is behind UTC.
After the DST is enabled, the local time and time difference will change compared with UTC, and the values of related
fields also need to be changed. Disabling the DST will bring into the opposite effect.
Example: In 1986, the DST was in effect from May 4 at 2:00 a.m. (GMT+8). During the DST period, the clocks were
moved one hour ahead, which means that there was one less hour on that day. When the DST ends at 2:00 a.m. on
September 14, 1986, the clocks were moved one hour back and there was an extra hour on that day. The changes of the
time are as follows:
## Notes:
## {
"dateTime": "1986-05-03T18:00:00Z", /*device time. The value in TZ format is the UTC time and the value in TD format is the time difference between the
device's local time and UTC*/
"timeDiff": "+08:00" /*optional, time difference between the local time and UTC time. If this field does not exist, the user application will convert
the dateTime into the local time for use*/
## }
To prevent characters not commonly used from resulting in exceptions in device programs and user applications, ISAPI
limits the valid field values of type string to a specific range of characters. Character sets allowed to be used in the fields
of type string in ISAPI are listed below.
DST Starts: 1986-05-04T02:00:00+08:00 --> 1986-05-04T03:00:00+09:00
DST Ends: 1986-09-14T02:00:00+09:00 --> 1986-09-14T01:00:00+08:00
The time difference cannot be simply used to determine the time zone. Because when the DST starts, the time
difference will change and it cannot represent the actual time zone.
Both TZ (UTC time, e.g., 1986-05-03T18:00:00Z) and TD (local time and time difference, e.g., 1986-05-
04T02:00:00+08:00) meet the time format standards of ISO 8601. In ISAPI, the TD format is recommended to be
used in messages sent from the user applications and the devices.
For representing the time difference information and forward compatibility, an extra field timeDiff is added as
shown in the example below. User applications need to support both TD format and TZ format when parsing the
time in the messages returned by devices.
A few old-version devices will return the time in TZ format.
## 4.2.5 Character Set
Single-byte character set: lowercase letters (a-z), uppercase letters (A-Z), digits (0-9), and special characters (see
details in the table below).
Multi-byte character set: language characters based on Unicode and encoded by UTF-8 (UTF-8 encoding is a
transformation format of Unicode character set. For details, refer to RFC 2044).
Hikvision co MMC
adil@hikvision.co.az

No.NameSpecial CharacterNo.NameSpecial Character
1Open Parenthesis(18Dollar Sign$
2Close Parenthesis)19Percent Sign%
3Plus Sign+20Ampersand&
4Comma,21Close Single Quotation Mark'
5Minus Sign-22Asterisk*
6Period.23Slash/
7Semicolon;24Smaller Than<
8Equal Sign=25Greater Than>
9At Sign@26Question Mark?
10Open Square Bracket[27Caret^
11Close Square Bracket]28Open Single Quotation Mark'
12Underscore_29Vertical Bar|
13Open Brace{30Tilde~
14Close Brace}31Double Quotation Marks"
15Space32Colon:
16Exclamation Mark!33Backslash|
17Octothorpe#
The valid characters that can be used in some special fields are listed below.
When requesting via ISAPI failed (the HTTP status code is not 200), the device will return the HTTP status code and
ISAPI error code. For HTTP status codes, refer to 10 Status Code Definitions in RFC 2616. For ISAPI error codes, refer to
## Error Code Dictionary.
## Message Example:
User name: lowercase letters (a-z), uppercase letters (A-Z), digits (0-9), and characters from No. 1 to No. 30 in the
special character table.
Password: User Name: lowercase letters (a-z), uppercase letters (A-Z), digits (0-9), and characters from No. 1 to
No. 33 in the special character table.
Names displayed on the UI (device name, person name, face picture library name, etc.): lowercase letters (a-z),
uppercase letters (A-Z), digits (0-9), characters from No. 1 to No. 15 in the special character table, and multi-byte
characters.
Normal fields of type string support lowercase letters (a-z), uppercase letters (A-Z), digits (0-9), characters from
No. 1 to No. 15 in the special character table, and multi-byte characters by default.
## 4.2.6 Error Processing
Hikvision co MMC
adil@hikvision.co.az

HTTP/1.1 403 Forbidden
Content-Type: application/json; charset="UTF-8"
Date: Thu, 15 Jul 2021 20:43:30 GMT
Content-Length: 229
Connection: Keep-Alive
## {
"requestURL": "/ISAPI/Event/triggers/notifications/channels/whiteLightAlarm",
"statusCode": 4,
"statusString": "Invalid Operation",
"subStatusCode": "notSupport",
"errorCode": 1073741825,
"errorMsg": "notSupport"
## }
When the rules configured on the device are triggered, the device will generate event messages (e.g., motion detection,
etc.) and actively upload them to the client. ISAPI supports three methods to receive event messages uploaded by the
device, that is, in arming mode, in listening mode, and via subscription.
The client establishes a HTTP persistent connection with the device to receive event messages from the device.
There are two methods (arming with subscription and arming without subscription) to receive events from the device.
The arming without subscription is to get all event messages from the device via HTTP GET method, while the arming
with subscription is to get messages of subscribed events via HTTP POST method.
## Notes
## Event Message Parsing:
## 4.3 Event Uploading
## 4.3.1 Arming
ISAPI arming (with or without subscription) uses the HTTP/HTTPS persistent connection. Due to the simplex
channel communication mode of HTTP, after establishing the arming connection, the device will send event
messages continuously, while it's not supported for clients to send any message to the device via the connection.
When the heartbeat timed out and no message is received from the device, you should terminate the arming
connection and try establishing a new one.
4.3.1.1 Arming without Subscription
- Establish the connection of arming without subscription: GET /ISAPI/Event/notification/alertStreamand keep
the connection alive via configuring Connection: keep-alive in HTTP headers on the client.
- Receive events sent by the device. The event message will be separated and parsed by boundary. For parsing
details, see Event Message Parsing below.
- Terminate the arming connection when no event message needs to be received.
Hikvision co MMC
adil@hikvision.co.az

GET /ISAPI/Event/notification/alertStream HTTP/1.1
## Host: <data_gateway_ip>
Connection: Keep-Alive
HTTP/1.1 401 Unauthorized
Date: Sun, 01 Apr 2018 18:58:53 GMT
## Server:
Content-Length: 178
Content-Type: text/html
Connection: keep-alive
Keep-Alive: timeout=10, max=99
WWW-Authenticate: Digest qop="auth", realm="IP Camera(C2183)", nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d", stale="FALSE"
GET /ISAPI/Event/notification/alertStream HTTP/1.1
Authorization: Digest username="admin",realm="IP
Camera(C2183)",nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d",uri="/ISAPI/Event/notification/alertStream",cnonce="3d183a245b8729121ae4ca3d41b90f18
## ",nc=00000001,qop="auth",response="f2e0728991bb031f83df557a8f185178"
## Host: 10.6.165.192
## HTTP/1.1 200 OK
MIME-Version: 1.0
Connection: close
Content-Type: multipart/mixed; boundary=<frontier>
## --<frontier>
Content-Type: application/xml; charset="UTF-8"  <!--some event messages are uploaded in JSON format, and the upper layer needs to distinguish the message
format accroding to Content-Type when parsing event messages-->
Content-Length: text_length
<EventNotificationAlert/>
## --<frontier>
Content-Disposition: form-data; name="Picture_Name"
Content-Type: image/pjpeg
Content-Length: image_length
[Picture Data]
## --<frontier>
Note: <data_gateway_ip> and <frontier> are variables, [Picture Data] indicates the raw data of a picture.
4.3.1.2 Arming with Subscription
Hikvision co MMC
adil@hikvision.co.az

- Get device system capabilities: GET /ISAPI/System/capabilities.
- Check if event subscription is supported: isSupportSubscribeEvent exists and its value is true. When
isSupportSubscribeEvent does not exist or its value is false, the device does not support event subscription.
- Get the capability of arming with subscription: GET /ISAPI/Event/notification/subscribeEventCap.
- Establish a connection of arming with subscription: POST /ISAPI/Event/notification/subscribeEvent. You need
to set Connection: keep-alive in HTTP Headers.
- (Optional) Edit parameters of the existing subscription. You need to get the subscription parameters first: GET
/ISAPI/Event/notification/subscribeEvent/<subscribeEventID>. Then, edit the parameters based on the
existing subscription configurations: PUT /ISAPI/Event/notification/subscribeEvent/<subscribeEventID>.
- Receive events sent by the device. The event messages will be separated and parsed by the boundary. For parsing
description, see Event Messages Parsing below.
Hikvision co MMC
adil@hikvision.co.az

## Note：
Three types of data will be transmitted on the arming link: <SubscribeEventResponse/>, <EventNotificationAlert/>,
and picture data. <SubscribeEventResponse/> is the data of first form sent by the device after arming established, see
the response parameters of URL (POST /ISAPI/Event/notification/subscribeEvent) for details; and
<EventNotificationAlert/> is the event content or heartbeat, you can identify the event type via field eventType, e.g.,
for heartbeat, the value of eventType is heartBeat.
## Event Messages Parsing:
Client Creates Arming with Subscription
POST /ISAPI/Event/notification/subscribeEvent HTTP/1.1
Authorization: Digest username="admin",realm="IP
Camera(C2183)",nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d",uri="/ISAPI/Event/notification/alertStream",cnonce="3d183a245b8729121ae4ca3d41b90f18
## ",nc=00000001,qop="auth",response="f2e0728991bb031f83df557a8f185178"
Host: device_ip
<SubscribeEvent/>
Server Responds to Request and Push Event Message
When the client sends a request to the device for establishing an arming connection, the device sends data in HTTP
form format (multipart/form-data). In HTTP request headers, the Content-Type is multipart/form-data,
boundary=AaB03x, of which the boundary is a variable used to divide the HTTP body into multiple units, and each unit
has its headers and body. For detailed format description, see RFC 1867 (Form-based File Upload in HTML). An example
is shown below. Please note two hyphens -- before and after boundary. In normal conditions, devices will not close the
arming link actively, and the end mark --AaB03x-- will not be sent on the arming link.
## HTTP/1.1 200 OK
Content-Type: multipart/form-data; boundary=AaB03x
Connection: keep-alive
--AaB03x
Content-Disposition: form-data; name="ANPR.xml"; filename="ANPR.xml";
Content-Type: application/xml
Content-Length: 9
## <ANPR/>
--AaB03x
Content-Disposition: form-data; name="licensePlatePicture.jpg"; filename="licensePlatePicture.jpg";
Content-Type: image/jpeg
Content-Length: 14
## Picture Data
--AaB03x--
The description of some keywords are as follows:
KeywordExampleDescription
## Content-
## Type
multipart/form-data;
boundary=AaB03x
Content type. multipart/form-data means the message is in form
format.
boundaryAaB03x
Delimiter of the form message. A form message which starts with --
boundary and ends with --boundary--.
## Content-
## Disposition
form-data; name=“ANPR.xml”;
filename=“ANPR.xml”;
Content description. form-data is a piece of form data.
name"ANPR.xml"Form name.
filename"ANPR.xml"File name of the form.
## Content-
## Length
9Content length, starting from the next \r\n to the next --boundary.
- (Optional) Terminate the connection of arming with subscription: PUT
/ISAPI/Event/notification/unSubscribeEvent?ID=<subscribeEventID>. When communicating with the device
via HTTP directly, there is no need to call this API. You can just terminate the connection.
Hikvision co MMC
adil@hikvision.co.az

After a client enables the listening service, when an event occurs, the device will send the event information actively to
the configured event receiving address. The event receiving address should be valid and configured on the device.
## Notes:
## 4.3.2 Listening
The client and event service can be the same program.
In listening mode, no heartbeat information is generated on devices.
4.3.2.1 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az

- Check whether the device supports configuring listening host parameters.
Get the configuration capability of the listening host: GET /ISAPI/Event/notification/httpHosts/capabilities.
If the node <HttpHostNotificationCap> is returned and its value is true, it indicates that the device supports
configuring listening host parameters.
- Configure parameters of the listening host.
Configure parameters of all listening hosts: PUT /ISAPI/Event/notification/httpHosts?security=
## <security>&iv=<iv>;
Get parameters of all listening hosts: GET /ISAPI/Event/notification/httpHosts?security=<security>&iv=
## <iv>;
Configure parameters of a listening host: PUT /ISAPI/Event/notification/httpHosts/<hostID>?security=
## <security>&iv=<iv>;
Get parameters of a listening host: GET /ISAPI/Event/notification/httpHosts/<hostID>?security=
## <security>&iv=<iv>.
- Enable the listening service.
You need to enable the listening service of the listening host.
- (Optional) Test the listening service.
Hikvision co MMC
adil@hikvision.co.az

Note: You can also configure the listening parameters such as the time out via URL
/ISAPI/Event/notification/httpHosts/<hostID>/uploadCtrl.
When an event occurs or an alarm is triggered in listening mode, the event/alarm information can be uploaded with
binary data (such as pictures) and without binary data.
The Content-Type in the headers of the HTTP request sent by the device is usually application/xml or
application/json as follows:
Alarm Message Sent by the Device
POST Request_URI HTTP/1.1 <!--Request_URI, related URI: POST /ISAPI/Event/notification/httpHosts-->
Host: data_gateway_ip:port <!--HTTP server's domain name / IP address and port No., related URI: POST /ISAPI/Event/notification/httpHosts-->
Accept-Language: en-us
Date: YourDate
Content-Type: application/xml; <!--Content Type, which is used for the upper layer to distinguish different formats when parsing the message-->
Content-Length: text_length
Connection: keep-alive  <!--maintain the connection between the device and the server for better transmission performance-->
<EventNotificationAlert/>
Response by the Listening Host
## HTTP/1.1 200 OK
Date: YourDate
Connection: close
The format of the data sent by the device is HTTP form (multipart/form-data). The Content-Type in the headers of the
HTTP request is usually multipart/form-data, boundary=<frontier>, of which boundary is a variable used to divide
the HTTP body into multiple units, and each unit has its headers and body. See details in RFC 1867 (Form-based File
Upload in HTML). An example is shown below. Please note two hyphens -- before and after the boundary.
Alarm Message Sent by the Device
POST Request_URI HTTP/1.1 <!--Request_URI, , related URI: POST /ISAPI/Event/notification/httpHosts-->
Host: device_ip:port <!--HTTP server's domain name / IP address and port No., related URI: POST /ISAPI/Event/notification/httpHosts-->
Accept-Language: en-us
Date: YourDate
Content-Type: multipart/form-data;boundary=<frontier>
Content-Length: text_length
Connection: keep-alive <!--maintain the connection between the device and the server for better transmission performance-->
## --<frontier>
Content-Disposition: form-data; name="Event_Type"
Content-Type: text/xml <!--some event messages are uploaded in JSON format, and the upper layer needs to distinguish the message format accroding to
Content-Type when parsing event messages-->
<EventNotificationAlert/>
## --<frontier>
Content-Disposition: form-data; name="Picture_Name"
Content-Length: image_length
Content-Type: image/jpeg
[Picture Data]
## --<frontier>--
Response by the Listening Host
- (Optional) Test the listening service.
The platform applies the command to the device to test whether the listening host is available for the device: POST
/ISAPI/Event/notification/httpHosts/<hostID>/test.
- The listening host receives event information from the device.
When an event occurs, the device creates connection with the client and uploads alarm information. Meanwhile,
the listening host receives data from the device. See details in Event Messages.
## 4.3.2.2 Event Messages
## 1. Without Binary Data:
## 2. With Binary Data:
Hikvision co MMC
adil@hikvision.co.az

## HTTP/1.1 200 OK
Date: YourDate
Connection: close
The description of some keywords are as follows:
KeywordExampleDescription
## Content-
## Type
multipart/form-data;
boundary=frontier
Content type, multipart/form-data refers to data in form format.
boundaryfrontier
Delimiter of the form message. A form message which starts with --
boundary and ends with --boundary--.
## Content-
## Disposition
form-data;
name="Picture_Name";
Content description. form-data is a piece of form data.
filename"Picture_Name"File name. The file refers to the form message.
## Content-
## Length
10Content length, starting from the next \r\n to the next --boundary.
## Error Codes
statusCodestatusStringsubStatusCodeerrorCodeDescription
6Invalid ContenteventNotSupport0x60001024
With arming and subscription, the client can establish HTTP persistent connection with the device, and continuously
receive the event messages from the device.
For ISAPI event arming, the client can receive all types of events by GET method, or receive the subscribed events only
by POST method.
## 4.3.2.3 Exception Handling
5 Device Management (General)
5.1 Arming and Subscription
5.1.1 Introduction to the Function
5.1.2 API Calling Flow
## 5.1.2.1 Without Subscription
- Establish a connection for arming: GET /ISAPI/Event/notification/alertStream. You need to set Connection:
keep-alive in HTTP Headers.
- When receiving events sent by the device, the event messages can be separated and parsed by boundary. See
“Parsing Event Messages” below for details.
- Disable the arming connection when you do not need to receive event messages.
## 5.1.2.1.2 Syntax
Hikvision co MMC
adil@hikvision.co.az

GET /ISAPI/Event/notification/alertStream HTTP/1.1
## Host: <data_gateway_ip>
Connection: Keep-Alive
HTTP/1.1 401 Unauthorized
Date: Sun, 01 Apr 2018 18:58:53 GMT
## Server:
Content-Length: 178
Content-Type: text/html
Connection: keep-alive
Keep-Alive: timeout=10, max=99
WWW-Authenticate: Digest qop="auth", realm="IP Camera(C2183)", nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d", stale="FALSE"
GET /ISAPI/Event/notification/alertStream HTTP/1.1
Authorization: Digest username="admin", realm="IP Camera(C2183)", nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d",
uri="/ISAPI/Event/notification/alertStream", cnonce="3d183a245b8729121ae4ca3d41b90f18", nc=00000001, qop="auth", response="f2e0728991bb031f83df557a8f185178"
## Host: 10.6.165.192
## HTTP/1.1 200 OK
MIME-Version: 1.0
Connection: close
Content-Type: multipart/form-data; boundary=<frontier>
## --<frontier>
Content-Type: application/xml; charset="UTF-8"  <!-- Some alarms are in JSON format, so the upper layer should parse based on the Content-Type field -->
Content-Length: text_length
<EventNotificationAlert/>
## --<frontier>
Content-Disposition: form-data; name="Picture_Name"
Content-Type: image/jpeg
Content-Length: image_length
[Image Data]
## --<frontier>
Note: <data_gateway_ip> and <frontier> are variables, and [Image Data] is an abbreviated representation
indicating the raw data of an image at this location.
## 5.1.2.2 Subscription
5.1.2.2.1 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az

- Get device system capabilities: GET /ISAPI/System/capabilities.
- Check if event subscription is supported: isSupportSubscribeEvent exists and its value is true. When
isSupportSubscribeEvent does not exist or its value is false, the device does not support event subscription.
- Get the capability of arming with subscription: GET /ISAPI/Event/notification/subscribeEventCap.
- Establish a connection of arming with subscription: POST /ISAPI/Event/notification/subscribeEvent. You need
to set Connection: keep-alive in HTTP Headers.
- (Optional) Edit parameters of the existing subscription. You need to get the subscription parameters first: GET
/ISAPI/Event/notification/subscribeEvent/<subscribeEventID>. Then, edit the parameters based on the
existing subscription configurations: PUT /ISAPI/Event/notification/subscribeEvent/<subscribeEventID>.
- Receive events sent by the device. The event messages will be separated and parsed by boundary. For parsing
description, see Event Messages Parsing below.
Hikvision co MMC
adil@hikvision.co.az

## Note：
Three types of data will be transmitted on the arming link: <SubscribeEventResponse/>, <EventNotificationAlert/>,
and picture data. <SubscribeEventResponse/> is the data of first form sent by the device after arming established, see
the response parameters of URL (POST /ISAPI/Event/notification/subscribeEvent) for details; and
<EventNotificationAlert/> is the event content or heartbeat, you can identify the event type via field eventType, e.g.,
for heartbeat, the value of eventType is heartBeat.
POST /ISAPI/Event/notification/subscribeEvent HTTP/1.1
Host: device_ip
Accept-Language: zh-cn
Date: YourDate
Content-Type: application/xml;
Content-Length: text_length
Connection: Keep-Alive
<SubscribeEvent/>
HTTP/1.1 401 Unauthorized
Date: Sun, 01 Apr 2018 18:58:53 GMT
## Server:
Content-Length: 178
Content-Type: text/html
Connection: keep-alive
Keep-Alive: timeout=10, max=99
WWW-Authenticate: Digest qop="auth", realm="IP Camera(C2183)", nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d", stale="FALSE"
POST /ISAPI/Event/notification/subscribeEvent HTTP/1.1
Authorization: Digest username="admin",realm="IP
Camera(C2183)",nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d",uri="/ISAPI/Event/notification/alertStream",cnonce="3d183a245b8729121ae4ca3d41b90f18
## ",nc=00000001,qop="auth",response="f2e0728991bb031f83df557a8f185178"
Host: device_ip
<SubscribeEvent/>
## HTTP/1.1 200 OK
MIME-Version: 1.0
Connection: close
Content-Type: multipart/mixed; boundary=<frontier>
## --<frontier>
Content-Type: application/xml; charset="UTF-8"  <!--some event messages are uploaded in JSON format, and the upper layer needs to distinguish the message
format accroding to Content-Type when parsing event messages-->
Content-Length: text_length
<SubscribeEventResponse/>
## --<frontier>
Content-Type: application/xml; charset="UTF-8"  <!--some event messages are uploaded in JSON format, and the upper layer needs to distinguish the message
format accroding to Content-Type when parsing event messages-->
Content-Length: text_length
<EventNotificationAlert/>
## --<frontier>
Content-Disposition: form-data; name="Picture_Name"
Content-Type: image/pjpeg
Content-Length: image_length
[Picture Data]
## --<frontier>
After the arming connection with the device is established, the data sent by the device is in HTTP form format
(multipart/form-data). In an HTTP request, Content-Type in Headers is usually multipart/form-data,
boundary=AaB03x, and boundary is a variable used to divide HTTP Body into multiple units, each being a set of data and
has its own Headers and Body. For detailed format description, see RFC 1867 (Form-based File Upload in HTML). An
example is shown below. Note the dash -- before and after boundary. Under normal circumstances, the device will not
actively close the arming connection, so the device will not send the form format end symbol --AaB03x-- on the
arming connection.
- (Optional) Terminate the connection of arming with subscription: PUT
/ISAPI/Event/notification/unSubscribeEvent?ID=<subscribeEventID>. When communicating with the device
via HTTP directly, there is no need to call this API. You can just terminate the connection.
## 5.1.2.2.2 Example
## 5.1.2.3 Event Messages Parsing
Hikvision co MMC
adil@hikvision.co.az

## HTTP/1.1 200 OK
Content-Type: multipart/form-data; boundary=AaB03x
Connection: keep-alive
--AaB03x
Content-Disposition: form-data; name="ANPR.xml"; filename="ANPR.xml";
Content-Type: application/xml
Content-Length: 9
## <ANPR/>
--AaB03x
Content-Disposition: form-data; name="licensePlatePicture.jpg"; filename="licensePlatePicture.jpg";
Content-Type: image/jpeg
Content-Length: 14
## Image Data
--AaB03x--
The description of some keywords are as follows:
KeywordExampleDescription
## Content-
## Type
multipart/form-data;
boundary=AaB03x
Content type. multipart/form-data means the message is in form
format.
boundaryAaB03x
Delimiter of the form message. --boundary is the start of a form. --
boundary-- is the end of the whole HTTP form message.
## Content-
## Disposition
form-data; name="ANPR.xml";
filename="ANPR.xml";
Content description.
name"ANPR.xml"Form name.
filename"ANPR.xml"File name of the form.
## Content-
## Length
9Content length, starting from the next \r\n to the next --boundary.
Note that ISAPI arming (with or without subscription) uses HTTP/HTTPS persistent connection. Due to the simplex
channel communication mode of HTTP, after establishing the arming connection, the device will send out event
messages continuously, while you cannot send any message to the device via the connection.
After the heartbeat time, if you do not receive any message from the device, you should disable the arming connection
and try establishing a new one.
POST /ISAPI/Event/notification/subscribeEvent HTTP/1.1
Authorization: Digest username="admin",realm="IP
Camera(C2183)",nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d",uri="/ISAPI/Event/notification/alertStream",cnonce="3d183a245b8729121ae4ca3d41b90f18
## ",nc=00000001,qop="auth",response="f2e0728991bb031f83df557a8f185178"
Host: device_ip
<SubscribeEvent/>
## 5.1.3 Restriction Description
## 5.1.4 Sample Messages
## 5.1.4.1 Establish Arming Subscription
5.1.4.2 The Device Responses and Uploads an Event Message
Hikvision co MMC
adil@hikvision.co.az

## HTTP/1.1 200 OK
MIME-Version: 1.0
Connection: close
Content-Type: multipart/mixed; boundary=<frontier>
## --<frontier>
Content-Type: application/xml; charset="UTF-8"  <!--Some alarm messages are in JSON format, so when parsing messages, the upper-layer should distinguish
them according to the Content-Type field.-->
Content-Length: text_length
<SubscribeEventResponse/>
## --<frontier>
Content-Type: application/xml; charset="UTF-8"  <!--Some alarm messages are in JSON format, so when parsing messages, the upper-layer should distinguish
them according to the Content-Type field.-->
Content-Length: text_length
<EventNotificationAlert version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
<ipAddress>10.17.133.46</ipAddress>
<portNo>80</portNo>
<protocol>HTTP</protocol>
<macAddress>44:19:b6:6d:24:85</macAddress>
<channelID>1</channelID>
<dateTime>2017-05-04T11:20:02+08:00</dateTime>
<activePostCount>0</activePostCount>
<eventType>heartBeat</eventType>
<eventState>active</eventState>
<eventDescription>heartBeat</eventDescription>
</EventNotificationAlert>
## --<frontier>
Content-Disposition: form-data; name="Picture_Name"
Content-Type: image/pjpeg
Content-Length: image_length
Content-ID: image_ID
[Picture Data]
## --<frontier>
When problems arise after a device is deployed on site, interaction message between the device and the external
network is necessary to help developers for troubleshooting. Packet capture can be stored on the local device, and
packet capture files can be exported after capture is complete. Also, packet capture files can be uploaded to cloud
storage, and packet capture data can be obtained in real-time even if the device does not have the storage space.
- Device packet capture: save packet capture files on the local device, and export the files after capture is complete.
Also, uploading packet capture files to cloud storage after capture is complete is supported. Then the client can obtain
the storage URL and download packet capture files from the cloud storage.
- Device real-time packet capture: after it is enabled, the device returns an URI for downloading packet capture data.
The client can submit this URI to the browser to download the packet data. The device transmits packet data via HTTP
Chunked, and users can store the packet data through the browser.
5.2 Calling Flow of Device Packet Capture
## 5.2.1 Function Introduction
5.2.2 API Calling Flow
## 5.2.2.1 Device Packet Capture
Hikvision co MMC
adil@hikvision.co.az

- Get device system capabilities: GET /ISAPI/System/capabilities. Get to know if the device supports packet capture
by the field: <isSupportNetworkCapture>true</isSupportNetworkCapture>.
- Check if the device supports packet captures: GET /ISAPI/System/networkCapture/capabilities?format=json. If
isSupportManualControl is true, the device supports packet capture. If isSupportManualControlAsyn is true, the
device supports asynchronous packet capture.
Hikvision co MMC
adil@hikvision.co.az

- Get storage path information of device packet capture: GET /ISAPI/System/networkCapture/StoragePathInfo?
format=json.
- Configure device packet capture parameters such as capture duration, storage path, port, and address: PUT
/ISAPI/System/networkCapture/captureParams?format=json.
- Get device packet capture parameters such as capture duration, storage path, port, and address: GET
/ISAPI/System/networkCapture/captureParams?format=json.
- Start device packet capture: depending on the parameters, packet capture files can be saved on the local device for
export after capture is complete, or packet capture files can be uploaded to cloud storage and downloaded via the
storage URL, or the packet capture data can be returned in real-time.
Start device packet capture: PUT /ISAPI/System/networkCapture/manualStart?format=json&asyn=<asyn>&realTime=
<realTime>.
## Note:
- After starting capture, you can repeatedly get capture status, including whether the capture is ongoing, the size of the
packet capture data, and the progress and storage URL for uploading the data to cloud storage.
Get status of device packet capture: GET /ISAPI/System/networkCapture/manualStatus?format=json.
- Packet capture can be stopped at any time by calling the interface of stopping packet capture.
Stop device packet capture: PUT /ISAPI/System/networkCapture/manualStop?format=json.
- (Optional) If packet capture data is stored on the local device, packet capture files need to be exported. If packet
capture files are saved to cloud storage or captured in real-time, there is no need to export packet capture files.
Export device packet capture files: GET /ISAPI/System/networkCapture/exportFile?format=json.
The process of real-time packet capture is shown as the following:
If the API does not contain URL parameters, the packet capture file is saved on the local device.
If the API contains asyn=true, the packet capture file is automatically uploaded to cloud storage after capture is
complete.
5.2.2.2 Device Real-Time Packet Capture
Hikvision co MMC
adil@hikvision.co.az

See the following figure for the calling flow:
- Get device system capabilities: GET /ISAPI/System/capabilities.
<isSupportStartNetworkCapture>true</isSupportStartNetworkCapture> indicates the device supports starting
packet capture. <isSupportStopNetworkCapture>true</isSupportStopNetworkCapture> indicates the device supports
stopping packet capture. <isSupportGetNetworkCaptureStatus>true</isSupportGetNetworkCaptureStatus> indicates
the device supports getting packet capture status.
- Get capabilities of packet capture parameters: GET /ISAPI/System/NetworkCaptureParams/capabilities?
format=json. The realTimeEnabled field indicates whether the device supports real-time packet capture.
- Set the field realTimeEnabled as true in the parameters applied to the device to start device packet capture. The
device returns an URI, and the client can download the real-time packet capture data from the device through a
browser.
Start packet capture: POST /ISAPI/System/StartNetworkCapture?format=json&security=<security>&iv=<iv>.
## Note:
- After starting packet capture, you can repeatedly get packet capture status, including whether packet capture is
ongoing and the size of the packet capture data.
Get packet capture status: GET /ISAPI/System/GetNetworkCaptureStatus?format=json.
- Packet capture can be stopped at any time by calling the interface of stopping packet capture.
Stop device packet capture: POST /ISAPI/System/StopNetworkCapture?format=json.
If realTimeEnabled=true is contained when starting device packet capture, it indicates packet capture data is
uploaded in real-time by HTTP Chunked. The URL for downloading the returned packet capture data is valid for 30
seconds by default. If the download is attempted after this time, the device should return an HTTP 404 status code.
## 5.3 Device Hardware Asset Management
Hikvision co MMC
adil@hikvision.co.az

Hardware assets: the host assets (CPU, memory, and HDD) and peripheral assets (hardware connected to the host
including camera, sensor, and USB flash drive).
Typical application: financial industry, where the head office needs to regularly count the security device assets of each
branch to collect the number, operation status, and other basic information of deployed host/storage/peripheral
cameras.
Extended application: management of industry-related service applications for assets customized by the industry
platform (e.g., information and software assets, person assets, and service assets) based on the hardware asset
integration.
- Get the search capability of the device hardware asset data via GET /ISAPI/System/deviceInfo/capabilities: when
isSupportSearchHardwareAssets is true, it indicates the device supports searching for asset data.
- Search for device hardware asset data via GET /ISAPI/System/deviceInfo/ExportDeviceAssets?format=json to get
the information of hardware assets on device including host assets, connected sub-device assets, HDD assets, etc.
- Export the device hardware asset information in binary data in Excel format.
Time sync is a method to synchronize the time of all devices connecting to the NTP server, so that all devices can share
the same clock time for providing related functions based on time. Supported time sync types: NTP time sync, manual
sync, satellite time sync, platform time synchronization, etc. The following describes the method of NTP time sync.
The local system of running NTP can receive sync from other clock sources (self as client), other clocks can sync from
the local system (self as server), and sync with other devices.
The basic working principle of NTP is shown in the picture. Device A and Device B are connected via the network, and
their systems follow their own independent system time. To auto sync their time, you can set device time auto sync via
NTP. For example:
Before time sync between Device A and Device B, the time of Device A is 10:00:00 am, and that of Device B is 11:00:00
am. Device B is set as the server of NTP server, so that the time of Device A should be synchronized with that of Device
B. The time of NTP message transmitted between Device A and Device B is 1 second.
The working process of system clock synchronization is as follows:
5.3.1 Introduction to the Function
5.3.2 API Calling Flow
## 5.4 Device Time Sync
5.4.1 Introduction to the Function
5.4.1.1 NTP Time Sync
Hikvision co MMC
adil@hikvision.co.az

Device A sends an NTP message to Device B with a timestamp of 10:00:00 am (T1) that is when it leaves Device A.
When the NTP message reaches Device B. Device B will add its own timestamp, which is 11:00:01 am (T2).
Then the NTP message leaves Device B with Device B's timestamp, which is 11:00:02 am (T3).
Device A receives the response message, and the local time of Device A is 10:00:03 am (T4).
Above all, Device A can calculate two important parameters:
Round-trip delay of NTP message: Delay = (T4-T1) - (T3-T2) = 2 seconds.
Time difference between Device A and Device B: offset = ((T2-T1)+(T3-T4))/2=1 h.
Device A can sync its own time with that of Device B according to calculation results.
- Get the Capability of Device Time synchronization Management
You can call this API to get the time sync types currently supported by the device, such as NTP time sync, manual time
sync, satellite time sync, EZ platform time sync.
Get the capability: GET /ISAPI/System/time/capabilities.
- Set device time synchronization management parameters
You can configure the time synchronization mode as follows：
Get device time synchronization management parameters: GET /ISAPI/System/time;
Set device time synchronization management parameters: PUT /ISAPI/System/time；
NTP time synchronization: See 4.2.2 NTP Time Sync (Client).
Manual time synchronization: Set the value of timeMode to manual, and set the device local time in nodes localTime、
timeZone.
Satellite time synchronization: Set the value of timeMode to satellite, and set the device local time in nodes
satelliteInterval.
Platform time synchronization: Set the value of timeMode to platform.
Note： For manual time synchronization (time offset including time zone offset): Set manual time synchronization:
localTime refers to the local time on device (time offset excluded, in format like 2019-02-28T10:50:44); timeZone refers
to the time offset of local time on device (time offset format with DST disabled: CST-8:00:00; time offset format with
DST enabled: CST-8:00:00DST00:30:00,M4.1.0/02:00:00,M10.5.0/02:00:00); Get manual time synchronization: localTime
refers to the local time on device (time offset included, in format like 2019-02-28T10:50:44+8:30); timeZone refers to
the time offset of local time on device (time offset format with DST disabled: CST-8:00:00; time offset format with DST
enabled: CST-8:00:00DST00:30:00,M4.1.0/02:00:00,M10.5.0/02:00:00).
- Get device time zone configuration capability
Call GET /ISAPI/System/capabilities to get the system capability. When isSupportTimeZone is returned, the time
zone configuration is supported by the device.
- Configure time zone parameters
Get the device's time zone parameters: GET /ISAPI/System/time/timeZone. Set the device's time zone parameters: PUT
/ISAPI/System/time/timeZone.
If DST (Daylight Saving Time) is disabled, the example of returned time zone parameters is: CST-8:00:00. It refers to
UTC+8, and -8:00:00 is the UTC local time. If DST (Daylight Saving Time) is enabled, the example of returned time zone
parameters is: CST-8:00:00DST00:30:00,M4.1.0/02:00:00,M10.5.2/02:00:00. It refers to UTC+8, the DST time is 30
minutes ahead of local time, the DST starts at 02:00:00 on the first Sunday of April and ends at 02:00:00 on the fifth
Tuesday of October. MX.Y.Z: X is the month, Y is the week number in the month, Z is the day of a week (0-Sunday, 1-
Monday, 2-Tuesday, 3-Wednesday, 4-Thursday, 5-Friday, 6-Saturday).
5.4.2 API Calling Flow
## 5.4.2.1 Time Sync Configuration
## 5.4.2.2 Time Zone Configuration
5.4.2.3 NTP Time Sync (Client)
Hikvision co MMC
adil@hikvision.co.az

The local system running the NTP server can receive sync information from other clock sources (self as client), sync
other clocks (self as server) as clock sources, and sync with other devices. Calling flow (self as client):
- Check whether the device supports synchronizing time via NTP server Get the capability of the device: GET
/ISAPI/System/time/capabilities; and check whether timeMode supports NTP.
- Set access parameters of the NTP server
Supports accessing the NTP server by IP address to synchronize the device time.
Get the access parameter capability of the NTP server: GET /ISAPI/System/time/ntpServers/capabilities
Set access parameters of the NTP server: PUT /ISAPI/System/time/ntpServers
Get access parameters of the NTP server: GET /ISAPI/System/time/ntpServers
- Set the time mode of the device to NTP
Supports setting the value of timeMode to NTP.
Get device time synchronization management parameters: GET /ISAPI/System/time Set device time synchronization
management parameters: PUT /ISAPI/System/time
The local system running the NTP server can receive sync information from other clock sources (self as client), sync
other clocks (self as server) as clock sources, and sync with other devices. Calling flow (self as server):
5.4.2.4 NTP Time Sync (Server Mode)
Hikvision co MMC
adil@hikvision.co.az

- Check whether the device supports configuring NTP service Get the capability of device time synchronization
management: GET /ISAPI/System/time/capabilities; If isSupportNtp is returned, it indicates that the device
supports time synchronization management.
- Set NTP server to the server mode
Supports setting the value of mode to server.
Get the capability of server mode: GET /ISAPI/System/time/ntp/capabilities?format=json
Set NTP to server mode: PUT /ISAPI/System/time/ntp?format=json
Get parameters of NTP server mode: GET /ISAPI/System/time/ntp?format=json
- Set the parameters of NTP server
Supports setting the IP address of the NTP server.
Get the capability of NTP server: GET /ISAPI/System/time/NTPService/capabilitis?format=json
Set the NTP server parameters: PUT /ISAPI/System/time/NTPService?format=json
Get the parameters of the NTP server: GET /ISAPI/System/time/NTPService?format=json
- Synchronize the device’s NTP service information with other devices
Supports synchronizing the time information to the camera.
Hikvision co MMC
adil@hikvision.co.az

Get the capability set of synchronizing device’s NTP service information with the camera: GET
/ISAPI/System/time/SyncDeviceNTPInfoToCamera/capabilities?format=json
Synchronize device’s NTP service information with the camera: PUT
/ISAPI/System/time/SyncDeviceNTPInfoToCamera?format=json
Get the progress of synchronizing device’s NTP service information with the camera: GET
/ISAPI/System/time/SyncDeviceNTPInfoToCamera/Progress?format=json
Search for the results of synchronizing device’s NTP service information with the camera: POST
/ISAPI/System/time/SyncDeviceNTPInfoToCamera/SearchResult?format=json
Some functions are mutually exclusive due to the device performance (for example, function A and function B cannot
run at the same time, i.e, only one of them is allowed at one time).
The following three APIs are available for the integration of mutually exclusive functions:
Device operation logs primarily include:
Log query functions include log query and security audit log query, which overlap to some extent. The differences are
as follows:
Operation logs can be queried and displayed item by item through the device web page, remote client, or platform. The
device web page log query is shown in the following figure.
## 5.5 Mutually Exclusive Functions
5.5.1 Introduction to the Function
5.5.2 API Calling Flow
- Get the information of mutually exclusive functions: GET /ISAPI/System/mutexFunction/capabilities?
format=json. Call this URL to get the list of existing mutually exclusive functions supported by the device. Note:
NVR devices only support setting exlusive function "perimeter" (perimeter protection), and do not support
"linedetection" (line crossing detection), "fielddetection" (intrusion detection), "regionEntrance" (region entrance),
or "regionExiting" (region exiting).
- Search for the functions that are mutually exclusive with a specified function: POST
/ISAPI/System/mutexFunction?format=json. Based on the list of mutually exclusive functions returned by GET
/ISAPI/System/mutexFunction/capabilities?format=json, you can search for the mutual exclusion status of a
specified function and see whether to change the settings and disbale the mutually exclusive function.
- Get the mutual exclusion information when device function exception occurs: GET
/ISAPI/System/mutexFunctionErrorMsg. After getting the error code, you can call this API to get the current
mutually exclusive functions.
## 5.6 Query Device Operation Log
5.6.1 Introduction to the Function
Operation records for the device, such as startup, restart, PTZ control, etc.
Events from the device, such as the start and end of motion detection, face capture, etc.
Device status exceptions, such as network disconnection, network recovery, IP address conflict, etc.
Device trigger information, such as starting recording, stopping recording, and periodically recording hard drive
status.
Log query is mainly designed to query all operational status and operation records of the device.
Security audit log query is mainly designed to query security-related status and operation records of the device,
such as user login/logout records, device SSH service start/stop records, etc.
Hikvision co MMC
adil@hikvision.co.az

Device TypeImplementation Differences
Encoding Devices (General Cameras/Storage Devices/Traffic
Cameras/Thermal Cameras/Security Inspection)
Input and output log information are
log.std-cgi.com/Infomation
Non-Encoding Devices (Access Control Devices/Transmission
Devices/Display & Control Devices)
Input and output log information are
log.std-cgi.com/Information
Operation logs can be exported to a client over the network or to an external storage medium (USB drive, external hard
drive, etc.) via a USB interface.
5.6.2 API Calling Flow
- Call POST /ISAPI/ContentMgmt/logSearch to query logs except security audit logs.
## Note 1:
When you query logs of a specified type, first set the metaId to log.std-cgi.com/Information. If the total
number returned is not 0, it indicates that the log query is standardized, and subsequent queries should follow
the standard. If the total number returned is 0, use log.std-cgi.com/Infomation to query again. If there is a
return value, subsequent queries should use log.std-cgi.com/Infomation.
When you set the metaId to all, the response results should be parsed for both log.std-
cgi.com/Infomation and log.std-cgi.com/Information.
When you query logs of a specified type , the recommended format for thesearchID field is the GUID (8-4-4-
4-12) format, such as 812F04E0-4089-11A3-9A0C-0305E82C2906.
- Call POST /ISAPI/ContentMgmt/security/logSearch to query security audit logs.
**Note **:
Standard definition: Query log POST /ISAPI/ContentMgmt/logSearch: log.std-cgi.com/Information
indicates querying information logs.
5.6.Export Device Operation Log
5.6.1 Introduction to the Function
5.6.2 API Calling Flow
5.6.2.1 Export to Client
- Call POST /ISAPI/ContentMgmt/logSearch/dataPackageto get the URL to download the exported device log.
Hikvision co MMC
adil@hikvision.co.az

Device operation logs are used in the following two scenarios:
Scenario 1: View the detailed operation log files to locate the issue when a device fails.
Scenario 2: Before a device fails, basic operation status information is recorded in the logs. Maintenance personnel can
proactively query the device operation status to promptly identify potential issues and faults in the device.
## Note:
Syslog is a standard log transmission protocol widely used in system logs. It is defined in RFC 5424 (The Syslog
Protocol). After you configure the Syslog service address and enable the Syslog function on the device, the device will
send its operation logs to the Syslog server using the Syslog protocol. The Syslog server can manage the operation logs
of multiple devices.
- The client downloads the log files via the URL returned by the device.
5.6.2.2 Export to USB Storage Medium
- Call GET /ISAPI/System/exportLogToUSB/capabilities?format=json to determine if the device supports log
output to a USB drive.
- Call PUT /ISAPI/System/exportLogToUSB/mode?format=json to set the parameters of exporting logs to a USB
drive.
- Call GET /ISAPI/System/exportLogToUSB/status?format=json to get the status of log output to a USB drive.
5.6.Device Operation Log
5.6.1 Introduction to the Function
The operation status logs generally include host information (network bandwidth, online users, video output
port/USB port status), linked device information (online status, video recording schedule/status), hard disk
information (capacity, status, runtime, temperature), etc.
For example, to ensure the normal operation of bank equipment and facilities, and to promptly identify hidden
dangers and faults in equipment operations, maintenance personnel of bank outlets are required to check the
equipment operation status at regular intervals each day and manually record data for subsequent data
traceability. This management approach consumes manpower and may result in data omissions. Therefore, you
can configure the equipment to automatically record operational status by schedule for querying and exporting
history data, thus saving labor and ensuring data integrity.
5.6.2 API Calling Flow
5.6.2.1 Upload to Specified FTP/HTTP(S) Server
- Call PUT /ISAPI/System/diagnosedData/server?format=json to allow devices to upload operation log files to a
specified FTP/HTTP(S) Server.
- Check the device logs on the FTP/HTTP(S) server.
See the "Device Operation Status Diagnosis" module for FTP/HTTP(S) Server API details.
We recommend that use this method to remotely obtain device operation logs for device operation and
maintenance platforms.
5.6.2.2 Upload to Syslog Server
- Get the Syslog management capabilities to determine if the device supports the Syslog function and the parameter
value range.
- Call PUT /ISAPI/System/logServer to configure Syslog server settings such as the IP address, port No., and
certificate.
- When the device upload logs to the Syslog server using the Syslog protocol, the logs can be viewed on the Syslog
server.
## 5.6.2.3 Query Device Operation Status Logs
- Call /ISAPI/ContentMgmt/RuningLogPlan?format=json to configure the device operation log recording schedule.
Hikvision co MMC
adil@hikvision.co.az

When the device is activated, you can log in to it via the admin account and corresponding password, and manage users
as needed, including:
## Remarks
Supports configuring up to 8 time points per day. The device will automatically store and back up the operation
status data at the corresponding time points for subsequent historical log viewing or export. The operation status
data includes host information (network bandwidth, online users, video output port/USB port status), external
device information (online status, video device recording plan/status), disk information (capacity, status, runtime,
temperature).
- Query historical device operation logs: /ISAPI/ContentMgmt/SearchRuningLogData?format=json.
- Export historical device operation logs: /ISAPI/ContentMgmt/ExportRuningLogData?format=json. Export based on
the query conditions set in step 2.
## 5.7 User Management
5.7.1 Introduction to the Function
- Change the password of the admin account. The user name cannot be edited.
- Add, edit, and delete other users, including the user type, password, user name, and so on. A Non-admin user can
log in to and operate the device after being created.
- Common user types:
Administrator (admin): has the permission of accessing all resources supported by the device, and can operate
all functions of the device. The admin account cannot be deleted.
Operator (operator): has the permission to view. Their operation permissions are assigned by admin.
Operator accounts are created by the administrator only.
User (viewer): has the permission to view only. They have no operation permission. User accounts are created
by the administrator only.
- User types related to the installer:
Local Administrator (localAdmin) : Activated by the device owner on the local software side (e.g., WEB) that
accompanies the device. By default, a localAdmin has the permission to access the device and perform all
functions supported by the device.
Local Installer (localInstaller) : Activated by localAdmin. The identity can be given to the installer for device
installation and debugging on site. By default, a localInstaller has the permission to access and perform all
functions supported by the device.
Local Operator (localOperator) : Created by localAdmin orcloudAdmin. A password is required to be set by
localAdmin, cloudAdmin, localInstaller, installerAdmin, or installerEmployee before the local operator
can log in via the local keypad. A local operator’s business functions are limited, and cannot configure device
parameters. By default, only arming, disarming (including alarm clearing), and relay control operations are
allowed. According to the actual business needs, there can be two types of local operator: one-time local
operator (can only log in once and the identity will expire after logging out), and temporary local operator (can
log in within the validity period), both created by localAdmin or cloudAdmin.
Cloud Administrator (cloudAdmin) : Created by the device owner in the mobile software that accompanies the
device (e.g. HC over the cloud) and then synchronized to the device. By default, a CloudAdmin has the
permission to access and perform all functions supported by the device.
Cloud Operator (cloudOperator) : Created by cloudAdmin in the mobile software that accompanies the device
(e.g. HC over the cloud) and then synchronized to the device for ordinary mobile users. A cloud operator’s
business functions are limited, and cannot configure device parameters, access and view the device,
arm/disarm (including alarm clearing), or operate relays.
Installer Administrator (installerAdmin) : User on the installer business application, created on the business
platform (e.g. HPC deployed in the cloud) and then synchronized to the device for remote device management
by the business platform’s admin. By default, an installerAdmin has the permission to access the device and
perform all functions supported by the device. To facilitate installation management, when the business
platform sets installerAdmin as the highest authority and synchronizes to the device, installerAdmin is
Hikvision co MMC
adil@hikvision.co.az

allowed to modify user permissions of localAdmin and cloudAdmin.
Installer Employee (installerEmployee) : User on the installer business application, created on the business
platform (e.g. HPC deployed in the cloud) and then synchronized to the device for the employees on the
business platform to remotely install and debug the device. By default, an installerEmployee has the
permission to access the device and perform all functions supported by the device.
- User password:
To ensure the security of account information, it is recommended to create a password using eight to sixteen
characters, including at least two kinds of the following categories: digits, lower case letters, upper case letters,
and special characters, and the user name is not allowed in the password.
Risky passwords include the following categories: less than 8 characters, containing only one type of
characters, same as the user name or reversed user name. To protect user data privacy and improve security,
it is recommended to use a strong password.
The password strength rule is as follows:
a. Strong password: including at least three kinds of the categories (digits, lower case letters, upper case
letters, and special characters).
b. Medium password: a combination of digits and special characters, lower case letters and special
characters, upper case letters and special characters, or lower case letters and upper case letters.
c. Weak password: a combination of digits and lower case letters or digits and upper case letters.
5.7.2 API Calling Flow
- Get the user management capability of devices on the client: GET
/ISAPI/Security/users/<indexID>/capabilities.
- Add device users on the client: POST /ISAPI/Security/users?security=<security>&iv=<iv>.
## Remarks:
Only admin can create other types of users, and creating users requires login password verification
(<loginPassword>) of admin.
If the user account is inactivated, it's required to log in to the account and change the user password (PUT
/ISAPI/Security/users/<indexID>?security=<security>&iv=<iv>). The account is activated when the
password is changed.
When the account is inactivated, it's not allowed to perform any operations except changing the user
password. Otherwise, an error (0x0020000f) will be returned.
- Edit the user information on the client: PUT /ISAPI/Security/users/<indexID>?security=<security>&iv=<iv>.
## Remarks:
It requires password verification of admin when admin changes the user password. The account turns
inactivated when the user password is changed by admin. Once logging out, the user needs to change the
password first before the next login.
When non-admin users changed their passwords, the account remains activated.
- Delete users on the client: DELETE /ISAPI/Security/users?loginPassword=<loginPassword>&security=
## <security>&iv=<iv>.
## Remarks:
Only admin can delete users, and deleting users requires login password verification of admin.
- Get the user information, including user name, activation status (<userActivationStatus>), and so on.
Get a single user information: GET /ISAPI/Security/users/<indexID>?security=<security>&iv=<iv>.
Get the information of all users: GET /ISAPI/Security/users?security=<security>&iv=<iv>.
Hikvision co MMC
adil@hikvision.co.az

## Remarks:
## Error Code
statusCodestatusStringsubStatusCodeerrorCodeerrorMsgDescription
## 4
## Invalid
## Operation
theAccountIsNotActivated0x0020000f
The account
is not
activated.
## 4
## Invalid
## Operation
loginPasswordError0x4000000C
## Incorrect
login
password.
## 4
## Invalid
## Operation
theAnswerToTheUserSecurityQuestionIsDuplicate0x4000A0B6
The answer
to the user
security
question is
duplicate.
Please set a
different
answer.
## 4
## Invalid
## Operation
theAnswerToTheUserSecurityQuestionIsTooShort0x4000A0B7
The answer
to the user
security
question is
too short.
Please set a
longer
answer.
## 4
## Invalid
## Operation
cannotSameAsOldPassword0x400010E8
## New
password
cannot be the
same as the
old one.
Please set a
different
password.
## 6
## Invalid
## Content
administratorPasswordError0x60000042
## Incorrect
administrator
password.
Please enter
the correct
password. If
you forgot
the
password,
you can
reset the
password.
For different application scenarios, e.g., local environment, cloud environment, and HPP installer environment, users
related to the installer can be classified into seven types: localAdmin, localInstaller, localOperator, cloudAdmin,
installerAdmin, installEmployee, and cloudOperator.
Get the information of online users: GET /ISAPI/Security/onlineUser. Online users refer to users who have
logged in to the device. The information such as user name, user type, and IP address can be obtained.
If multiple attempts of admin login password verification failed in the process of adding, editing, or deleting users,
the admin will be locked. The remaining attempts are defined by the field retryTimes in the response message.
The new password cannot be the same as the last password. Otherwise, an error (0x400010E8) will be returned.
## 5.7.3 Exception Handling
5.8 User Types Related to the Installer (supported by the security
control panel)
Hikvision co MMC
adil@hikvision.co.az

In a local environment (LAN), three types of users are involved: localAdmin, localInstaller, and localOperator. By
default, two types of users exist on the device: localAdmin and localInstaller, but localInstaller is not enabled,
which means that although a user ID is created, but the user cannot log in as localInstaller before the user type is
enabled by localAdmin. localOperator is created by localAdmin, and can only log in via local keypad. Users who have
been set with the keypad password can log in via keypad.
In a cloud environment, four types of users are involved: cloudAdmin, cloudOperator, localInstaller, and
localOperator. After logging in to the device on HC application via cloud, a cloudAdmin can be created. Then, the
cloudAdmin can share the device to create a cloudOperator. Note that after a cloudAdmin is created, the existing
localAdmin will expire. Users who have been set with the keypad password can log via keypad.
5.8.1 Create the User
## 5.8.1.1 Local Environment
## 5.8.1.2 Cloud Environment
5.8.1.3 HPP Installer Environment
Hikvision co MMC
adil@hikvision.co.az

In an HPP installer environment, five types of users are involved: cloudAdmin, cloudOperator, localOperator,
installerAdmin, and installerEmployee. After a device is added to HPC, the user adding protocol will be applied, and
installerAdmin and installerEmployee can be created (batch creating is supported). Note that after an
installerAdmin is created, the existing localInstaller will expire. Users who have been set with the keypad
password can log via keypad.
## User Type /
## Permission
## Local
## Admin
## Local
## Installer
## Local Operator
## Cloud
## Admin
## Cloud
## Operator
## Installer
## Admin
## Installer
## Employee
## Arming√√√√√√√
Disarming (Alarm
## Clearing)
## √√√√√√√
## Bypass√√×√√√√
View logs and
status
## √√×√√√√
## Configure
parameters
## √√×√×√√
Manage partitions√√×√×√√
Operate relays√√
one-time local operator:
× temporary local
operator: √
## √√√√
Edit localAdmin's
keypad password
## √√×××√√
Edit cloudAdmin's
## ×√×√×√√
## 5.8.2 User Permissions
Hikvision co MMC
adil@hikvision.co.az

Edit cloudAdmin's
keypad password
## ×√×√×√√
Edit localInstaller's
keypad password
## ×√×××××
## Edit
installerAdmin's
keypad password
## ×××××√×
## Edit
installerEmployee's
keypad password
## ×××××√
√ (only the
employee's
own
password)
## Edit
localOperator's
keypad password
## √√×√×√√
## Edit
cloudOperator's
keypad password
## ×√×√
√ (only the
operator's own
password)
## √√
Edit localAdmin's
permission
## ×××××××
Edit cloudAdmin's
permission
## ×××××××
Edit localInstaller's
permission
## √××√×××
## Edit
installerAdmin's
permission
## √××√×××
## Edit
installerEmployee's
permission
## √××√×××
## Edit
localOperator's
permission
## √√×√×√√
## Edit
cloudOperator's
permission
## ×√×√×√√
Note: "Configure parameters" includes parameters of zones, sounders, keypads, card readers, keyfobs, cards, relays,
repeaters, transmitters, network cameras, partitions, and so on.
## 5.8.3 Manage User Information
## 5.8.3.1 Local User
Hikvision co MMC
adil@hikvision.co.az

- Get the configuration capability of a specific user: GET /ISAPI/Security/users//capabilities
- (Optional) Add a user: POST /ISAPI/Security/users?security=&iv=. The nodes userName, password,
keypadPassword, and loginPassword in the message will be encrypted.
- Get information of all users: GET /ISAPI/Security/users?security=&iv=. The nodes phoneNum, emailAddress,
password, duressPassword, keypadPassword, and loginPassword in the message will be encrypted.
- Get information of a single user: GET /ISAPI/Security/users/?security=&iv=. The index in the URL is the user ID.
- Set permissions for a single user: PUT /ISAPI/Security/users/?security=&iv=. The index in the URL is the user ID.
- (Optional) Set information of all users: PUT /ISAPI/Security/users?security=&iv=. This API can be called for batch
configuring user information.
- (Optional) Delete a single user: DELETE /ISAPI/Security/users/?loginPassword=&security=&iv=. Delete the user by
indexID, and loginPassword is required for deleting the user. The loginPassword should be encrypted.
- (Optional) Delete all users: DELETE /ISAPI/Security/users?loginPassword=&security=&iv=. loginPassword should
be encrypted.
## 5.8.3.2 Cloud User
Hikvision co MMC
adil@hikvision.co.az

- Check whether the device supports cloud user management: GET /SDK/capabilities. If the node value of
isSupportCloudUserManage is true, cloud user management is supported in these URLs:
/ISAPI/Security/CloudUserManage/users/capabilities?format=json
/ISAPI/Security/CloudUserManage/users/?format=json
/ISAPI/Security/CloudUserManage/users?format=json
- Get the capability of cloud user management: GET /ISAPI/Security/CloudUserManage/users/capabilities?
format=json. If the node value of isSupportAddCloudUserList is true, it supports batch adding cloud users.
- Add a single cloud user: POST /ISAPI/Security/CloudUserManage/users?format=json. The following cloud users
need to create the user accounts on their own: coludAdmin, installerAdmin, installerEmployee, and cloudOperator,
which is different from localOperator who needs to be created by admin users. Enter information such as user
name, password, e-mail, and phone number to create a user account and put into use.
Hikvision co MMC
adil@hikvision.co.az

name, password, e-mail, and phone number to create a user account and put into use.
- (Optional) Add cloud users in a batch: POST /ISAPI/Security/CloudUserManage/usersBatch?format=json. For
installerEmployee users that has been created on HPC, use this URL to apply them to the device and synchronize
user information.
- Get information of all cloud users: GET /ISAPI/Security/CloudUserManage/users?format=json
- Get information of a single cloud user: GET /ISAPI/Security/CloudUserManage/users/?format=json
- Search for information of a single cloud user (by type): /ISAPI/Security/CloudUserManage/users/byType?
format=json. Support searching by e-mail, phone number, and user name.
- Set information of a single cloud user: PUT /ISAPI/Security/CloudUserManage/users/?format=json
- Delete a single cloud user: DELETE /ISAPI/Security/CloudUserManage/users/?format=json. Delete the user by
specifying the user's indexID.
- Delete cloud users in a batch: PUT /ISAPI/Security/CloudUserManage/users/delete?format=json. Support batch
deleting by user names, user types, phone numbers, and e-mails.
## 5.8.4 Manage User Permissions
- Check whether the device supports configuring permissions of a specific type of users: GET
/ISAPI/Security/capabilities?username=. If the node value of isSupportInstallerCap is true, the installer users'
permissions can be configured. There is no specific capability node for operator type users, and by default their
permissions can be configured.
- Get the default permission capabilities of a specific type of users.
For installer users: GET /ISAPI/Security/UserPermission/installer/capabilities?format=json
Hikvision co MMC
adil@hikvision.co.az

After the related user information to be collected is imported to the device, the device can collect and store the data for
uploading to the upper platform/client when the network restores. This function can meet the needs of data collection
in non-real-time mode in specific situations.
For operator users: GET /ISAPI/Security/UserPermission/operatorCap
- Get user permissions of all users: GET /ISAPI/Security/UserPermission
- (Optional) Get user permissions of a single user: GET /ISAPI/Security/UserPermission/. The index in the URL is the
user ID.
- Set user permissions of a single user: PUT /ISAPI/Security/UserPermission/
- (Optional) Set user permissions of all users: PUT /ISAPI/Security/UserPermission
## 6 Credentials Collection
## 6.1 Offline Collection
6.1.1 Introduction to the Function
6.1.2 API Calling Flow
## 6.1.2.1 Offline Data Collection
Hikvision co MMC
adil@hikvision.co.az

- Get the functional capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportOfflineCapture is returned and its value is "true", it indicates that the device supports offline data
collection.
- Get the offline collection capability: GET /ISAPI/AccessControl/OfflineCapture/capabilities?format=json; get
the relevant APIs and parameters.
- Download user list template of offline collection: POST
/ISAPI/AccessControl/OfflineCapture/InfoFileTemplateDownload?format=json.
- Upload the user list of offline collection: POST /ISAPI/AccessControl/OfflineCapture/InfoFile?format=json.
- Get the progress of uploading the user list of offline collection: GET
/ISAPI/AccessControl/OfflineCapture/InfoFile/progress?format=json.
- Get the details of failing to upload the files with offline collection user list: GET
/ISAPI/AccessControl/OfflineCapture/uploadFailedDetails?format=json.
Hikvision co MMC
adil@hikvision.co.az

Request URL
GET /ISAPI/System/deviceInfo/capabilities
## Query Parameter
## None
## Request Message
## None
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<DeviceInfo xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, device information, attr:version{opt, string, protocolVersion}-->
<deviceName min="0" max="132">
<!--ro, req, string, device name, range:[1,132], attr:min{opt, string},max{opt, string}-->test
</deviceName>
<deviceID min="1" max="128">
<!--ro, opt, string, device ID, range:[1,128], attr:min{opt, string},max{opt, string}-->123456
</deviceID>
<deviceDescription min="1" max="128">
<!--ro, opt, string, device description, range:[1,128], attr:min{opt, string},max{opt, string}-->test
</deviceDescription>
<deviceLocation opt="STD-CGI">
<!--ro, opt, string, device location, range:[1,32], attr:opt{opt, string}-->hangzhou
</deviceLocation>
<systemContact opt="STD-CGI">
<!--ro, opt, string, manufacturer, range:[1,32], attr:opt{opt, string}-->test
</systemContact>
<model min="1" max="64">
<!--ro, opt, string, device model, range:[1,64], attr:min{opt, string},max{opt, string}-->iDS-9632NX-I8/X
## </model>
<serialNumber min="1" max="48">
<!--ro, opt, string, device serial No., range:[1,48], attr:min{opt, string},max{opt, string}-->iDS-9632NX-I8/X1620181209CCRRC77605411WCVU
</serialNumber>
<macAddress min="1" max="64">
- Apply the offline collection user information (JSON format): add offline collection user information (JSON format):
POST /ISAPI/AccessControl/OfflineCapture/userInfo?format=json; edit offline collection user information
(JSON format): PUT /ISAPI/AccessControl/OfflineCapture/userInfo?format=json.
- Get the parameters of offline collection rules: GET /ISAPI/AccessControl/OfflineCapture/ruleInfo?
format=json; set the parameters of offline collection rules: PUT
/ISAPI/AccessControl/OfflineCapture/ruleInfo?format=json.
- Search for the offline collection progress: GET /ISAPI/AccessControl/OfflineCapture/progress?format=json.
## 6.1.2.2 Collected Data Management
- Search for the collected data: POST /ISAPI/AccessControl/OfflineCapture/DataCollections/searchTask?
format=json.
- Download data collected offline: POST /ISAPI/AccessControl/OfflineCapture/DataCollections/downloadTask?
format=json.
- Export the offline collected data: PUT /ISAPI/AccessControl/OfflineCapture/dataOutput?
format=json&security=<security>&iv=<iv>; Get the progress of exporting the offline collected data: GET
/ISAPI/AccessControl/OfflineCapture/dataOutput/progress?format=json.
- Deleted offline collected data. Delete a specific piece of offline collected data: DELETE
/ISAPI/AccessControl/OfflineCapture/DataCollections/<captureNo>?format=json; delete offline collected
data by conditions: POST /ISAPI/AccessControl/OfflineCapture/deleteDataCollections?format=json; delete
all offline collected data: DELETE /ISAPI/AccessControl/OfflineCapture/DataCollections?format=json.
7 API Reference
7.1 Device Management (General)
## 7.1.1 Device Basic Information Management
7.1.1.1 Get configuration capability of the device information parameters
Hikvision co MMC
adil@hikvision.co.az

<macAddress min="1" max="64">
<!--ro, opt, string, MAC address, range:[1,64], attr:min{opt, string},max{opt, string}-->44:47:cc:c8:d9:e4
</macAddress>
<firmwareVersion min="1" max="64">
<!--ro, opt, string, device firmware version, range:[1,64], attr:min{opt, string},max{opt, string}-->V4.1.40
</firmwareVersion>
<firmwareReleasedDate min="1" max="64">
<!--ro, opt, string, release date of the device firmware version, range:[1,64], attr:min{opt, string},max{opt, string}-->build 181129
</firmwareReleasedDate>
<encoderVersion min="1" max="64">
<!--ro, opt, string, device description, range:[1,64], attr:min{opt, string},max{opt, string}-->V7.3
</encoderVersion>
<encoderReleasedDate min="1" max="64">
<!--ro, opt, string, release date, range:[1,64], attr:min{opt, string},max{opt, string}-->build 20161223
</encoderReleasedDate>
<bootVersion min="1" max="16">
<!--ro, opt, string, boot version, range:[1,16], attr:min{opt, string},max{opt, string}-->V1.3.4
</bootVersion>
<bootReleasedDate min="1" max="16">
<!--ro, opt, string, release date of boot, range:[1,16], attr:min{opt, string},max{opt, string}-->100316
</bootReleasedDate>
<panelVersion min="1" max="64">
<!--ro, opt, string, range:[1,64], attr:min{opt, string},max{opt, string}-->V1.0
</panelVersion>
<hardwareVersion min="1" max="24">
<!--ro, opt, string, hardware version, range:[1,24], attr:min{opt, string},max{opt, string}-->0x0
</hardwareVersion>
<subDeviceType
opt="accessControlTerminal,attendanceCheckDevice,multiChannelAccessController,multiChannelTraditionalAccessController,multiChannelWirelessAccessController,p
ersonAndIdCardDevice,smartAnalysisTerminal,doorStation,indoor,mainStation,dropGate,wingGate,threeRollerGate,swingGate,elevatorSecurityGW,visitTerminal,doorT
erminal,bedheadTerminal,bedsideTerminal,outerDoorStation,doorPhone,villaDoorStation,twoWireDoorStation,personnelChannelTerminal,smartPad,entrywayStation,TSS
900,NormalEntrance,FaceEntrance,HighSpeedEntrance,DirPassEntrance,TCLParking,TCPParking,VPEParking,TCRParking,NormalParking,VISDecoder,FPlinkageCamera,FPTem
pCamera,FPSmartCamera,thermalFireDetector,visualSmokeDetector,imageFireDetector,visualInfraredFiredetector,slidingGateOpener,indoorScreen,outdoorScreen,vide
oPanicAlarmPanel,nonVideoPanicAlarmPanel,panicAlarmStation,panicAlarmBox">
<!--ro, opt, string, device sub type., attr:opt{req, string}-->accessControlTerminal
</subDeviceType>
<telecontrolID min="1" max="255">
<!--ro, opt, int, remote control ID, range:[1,255], attr:min{opt, string},max{opt, string}-->8
</telecontrolID>
<subChannelEnabled>
<!--ro, opt, bool, whether to enable two channels-->true
</subChannelEnabled>
<thrChannelEnabled>
<!--ro, opt, bool, whether to enable three channels-->true
</thrChannelEnabled>
<powerOnMode opt="button,adapter" def="button">
<!--ro, opt, enum, device startup mode, subType:string, attr:opt{opt, string},def{opt, string}, desc:"button", "adapter"-->button
</powerOnMode>
<customizedInfo min="0" max="128">
<!--ro, opt, string, device custom No., range:[0,128], attr:min{req, int},max{req, int}, desc:for baseline devices, returing this node is not required--
## >test
</customizedInfo>
<languageType
opt="chinese,english,spanish,portuguese,italian,french,russian,turkish,greek,czech,brazilianPortuguese,slovenian,swedish,norwegian,romanian,danish,german,po
lish,dutch,hungarian,slovak,serbian,southAmericanSpanish,ukrainian,croatian,irish,bulgarian,hebrew,thai,indonesian,arabic,traditionalChinese,lithuanian,angl
icism,estonian,albanian">
<!--ro, opt, string, language type, range:[1,32], attr:opt{opt, string}, desc:"chinese", "english", "spanish", "portuguese", "italian", "french",
"russian", "turkish", "greek", "czech", "brazilianPortuguese", "slovenian", "swedish", "norwegian", "romanian", "danish", "german", "polish", "dutch",
"hungarian", "slovak", "serbian", "southAmericanSpanish", "ukrainian", "croatian", "irish", "bulgarian", "hebrew", "thai", "indonesian", "arabic",
"traditionalChinese","lithuanian","anglicism", "estonian", "albanian"-->chinese
</languageType>
<localZoneNum min="0" max="16">
<!--ro, opt, int, number of local zones, range:[0,16], attr:min{opt, string},max{opt, string}-->1
</localZoneNum>
<alarmOutNum min="0" max="16">
<!--ro, opt, int, number of alarm outputs, range:[0,16], attr:min{opt, string},max{opt, string}-->1
</alarmOutNum>
<relayNum min="0" max="16">
<!--ro, opt, int, number of local relays, range:[0,16], attr:min{opt, string},max{opt, string}-->1
</relayNum>
<electroLockNum min="0" max="16">
<!--ro, opt, int, number of local electronic locks, range:[0,16], attr:min{opt, string},max{opt, string}-->1
</electroLockNum>
<sirenNum min="0" max="16">
<!--ro, opt, int, number of sirens, range:[0,16], attr:min{opt, string},max{opt, string}-->1
</sirenNum>
<alarmLamp min="0" max="16">
<!--ro, opt, int, number of alarm lights, range:[0,16], attr:min{opt, string},max{opt, string}-->1
</alarmLamp>
<RS485Num min="0" max="16">
<!--ro, opt, int, number of local RS-485, range:[0,16], attr:min{opt, string},max{opt, string}-->1
</RS485Num>
<DockStation>
<!--ro, opt, object, dock station information configuration-->
<Platform>
<!--ro, opt, object, information configuration of the dock station accessing the platform-->
## <ip>
<!--ro, opt, string, IP address, range:[1,32]-->0.0.0.0
## </ip>
## <port>
<!--ro, opt, int, port No., range:[1,65535]-->1
## </port>
<userName>
<!--ro, req, string, user name, range:[1,32]-->test
Hikvision co MMC
adil@hikvision.co.az

<!--ro, req, string, user name, range:[1,32]-->test
</userName>
## <password>
<!--ro, req, string, password, range:[1,16]-->test
## </password>
</Platform>
<centralStorageBackupEnabled opt="true, false">
<!--ro, opt, bool, whether to enable center storage backup, attr:opt{opt, string}, desc:when it is enabled, the device uploads all data to the center
storage for backup before uploading them to the platform; when it is disabled, the device uploads data to the platform directly, and for those important
data, the platform will apply the file list to the device for center storage (related URI: /ISAPI/ContentMgmt/record/control/centralStorageBackup), then the
device will upload the data with storage URI to the platform-->true
</centralStorageBackupEnabled>
<isSupportManufacturer>
<!--ro, opt, bool, whether it supports configuring third-party manufacturer for the body camera, desc:related URI:
/ISAPI/Traffic/dockStation/slot/Manufacturer/capabilities?format=json-->true
</isSupportManufacturer>
</DockStation>
<webVersion>
<!--ro, opt, string, Web version No., range:[1,32]-->1.0
</webVersion>
<deviceRFProgramVersion>
<!--ro, opt, string, device RF program version No., range:[1,32]-->1.0
</deviceRFProgramVersion>
<securityModuleSerialNo>
<!--ro, opt, string, security module serial No., range:[1,48]-->1.0
</securityModuleSerialNo>
<securityModuleVersion>
<!--ro, opt, string, security module version No., range:[1,32]-->1.0
</securityModuleVersion>
<securityChipVersion>
<!--ro, opt, string, security chip version No., range:[1,32]-->1.0
</securityChipVersion>
<securityModuleKeyVersion>
<!--ro, opt, string, security module key version No., range:[1,32]-->1.0
</securityModuleKeyVersion>
<UIDLampRecognition>
<!--ro, opt, object, recognize the device information by UID-->
<enabled opt="true,false">
<!--ro, opt, bool, whether to enable, attr:opt{opt, string}-->true
## </enabled>
</UIDLampRecognition>
<confDeviceIdPrefix opt="true,false">
<!--ro, opt, bool, whether the meeting uses the device name as its prefix, attr:opt{opt, string}-->true
</confDeviceIdPrefix>
<simpleAlgorithmVersion min="0" max="10">
<!--ro, opt, string, single algorithm version, attr:min{req, int},max{req, int}-->test
</simpleAlgorithmVersion>
<bootTime>
<!--ro, opt, datetime, system boot time-->1970-01-01T00:00:00+08:00
</bootTime>
<isSupportNewVersionDevlanguageSwitch>
<!--ro, opt, bool, whether it supports switching languages for the new protocol version-->true
</isSupportNewVersionDevlanguageSwitch>
<intelligentAnalysisEngineModel>
<!--ro, opt, string, engine model, range:[1,32]-->K81
</intelligentAnalysisEngineModel>
<marketType opt="0,1,2">
<!--ro, opt, enum, market type, subType:int, attr:opt{req, string}, desc:0 (invalid), 1 (distribution type), 2 (industry type)-->0
</marketType>
<protocolFileURL min="1" max="32">
<!--ro, opt, string, protocol notice URI, attr:min{opt, string},max{opt, string}-->test
</protocolFileURL>
<recycleRecordEnabled opt="true,false">
<!--ro, opt, bool, whether to enable overwritten recording, attr:opt{req, string}-->false
</recycleRecordEnabled>
<decordChannelNums>
<!--ro, opt, int, number of decoding channels-->0
</decordChannelNums>
<VGANums>
<!--ro, opt, int, number of VGA ports-->0
</VGANums>
<USBNums>
<!--ro, opt, int, number of USB ports-->0
</USBNums>
<auxoutNums>
<!--ro, opt, int, number of auxiliary ports-->0
</auxoutNums>
<expansionBoardVersion min="0" max="32">
<!--ro, opt, string, extension board version information, range:[0,32], attr:min{req, int},max{req, int}-->test
</expansionBoardVersion>
<initWizzardDisplay opt="true,false">
<!--ro, opt, bool, whether it displays initialization wizard, attr:opt{req, string}, desc:it is only used for displaying configuration of applications
integrated to the wizard such as local GUI. By default, the value is true; it is false after the wizard is configured on the local GUI-->true
</initWizzardDisplay>
<beaconID min="0" max="32">
<!--ro, opt, string, device RF program version No., range:[0,32], attr:min{req, int},max{req, int}, desc:by default, it is the current value-->test
</beaconID>
<isResetDeviceLanguage opt="true,false">
<!--ro, opt, bool, whether to reset the language, attr:opt{req, string}, desc:only Admin and Installer have the permission to switch the device
language. If the value is true, the Hik-Connect Mobile Client and the device's web page display device information in the target language; if the value is
false, the language switching takes no effect on the Hik-Connect Mobile Client and the device's web page-->false
</isResetDeviceLanguage>
<dispalyNum>
<!--ro, opt, int, number of device screens-->2
Hikvision co MMC
adil@hikvision.co.az

</dispalyNum>
<bspVersion min="1" max="1">
<!--ro, opt, string, BSP version, attr:min{req, int},max{req, int}-->test
</bspVersion>
<dspVersion min="1" max="1">
<!--ro, opt, string, DSP version, attr:min{req, int},max{req, int}-->test
</dspVersion>
<localUIVersion min="1" max="1">
<!--ro, opt, string, local UI version, attr:min{req, int},max{req, int}-->test
</localUIVersion>
<OPCASubType opt="PDA,pump,column,autoSampler,SOC">
<!--ro, opt, enum, the sub type of optical physical and chemical analyzer, subType:string, attr:opt{req, string}, desc:"detector"; "pump"; "columnOven"
(column oven); "autoSampler" (auto sampler)-->detector
</OPCASubType>
<wiegandOutNum min="0" max="1">
<!--ro, opt, int, number of Wiegand outputs, range:[0,1], attr:min{opt, string},max{opt, string}-->1
</wiegandOutNum>
<ChipVersionInfoList size="6">
<!--ro, opt, object, chip version information list, attr:size{req, int}-->
<ChipVersionInfo>
<!--ro, opt, object, chip version information-->
<ID min="0" max="1">
<!--ro, req, int, chip No., range:[0,1], attr:min{req, int},max{req, int}, desc:the No.s of chips of different types can be duplicate. Users can
distinguish them by chip type and chip No. together-->1
## </ID>
<firmwareVersion min="0" max="64">
<!--ro, req, string, chip firmware version, range:[0,64], attr:min{req, int},max{req, int}-->1.0.0
</firmwareVersion>
<chipName min="0" max="32">
<!--ro, opt, string, chip name, range:[0,32], attr:min{req, int},max{req, int}-->test
</chipName>
</ChipVersionInfo>
</ChipVersionInfoList>
<personBagLinkAlgoEngineVersion min="0" max="64">
<!--ro, opt, string, engine version of the person & package linkage module, range:[0,64], attr:min{req, int},max{req, int}, desc:this node is for
analyzer (security inspection)-->1.0.0
</personBagLinkAlgoEngineVersion>
<BIOSVersion min="0" max="16">
<!--ro, opt, string, BIOS version, range:[0,16], attr:min{req, int},max{req, int}-->V1.3.4
</BIOSVersion>
<contactInformation min="0" max="64">
<!--ro, opt, string, contact information, range:[0,64], attr:min{req, int},max{req, int}-->test
</contactInformation>
<PedestrianWarningModuleVersion>
<!--ro, opt, object, pedestrian warning module information, desc:this node is returned only for pedestrian warning devices-->
<pedestrianWarningMCUVersion min="1" max="32">
<!--ro, opt, string, MCU program version, range:[0,16], attr:min{req, int},max{req, int}-->V1.3.4
</pedestrianWarningMCUVersion>
<pedestrianWarningRadarVersion min="1" max="32">
<!--ro, opt, string, the program version of pedestrian warning radar, range:[0,16], attr:min{req, int},max{req, int}-->V1.3.4
</pedestrianWarningRadarVersion>
<pedestrianRangingModuleVersion min="1" max="32">
<!--ro, opt, string, the program version of the pedestrian distance measurement module, range:[0,16], attr:min{req, int},max{req, int}-->V1.3.4
</pedestrianRangingModuleVersion>
</PedestrianWarningModuleVersion>
<encryptionModel min="0" max="16">
<!--ro, opt, string, device encryption model, range:[0,16], attr:min{req, int},max{req, int}, desc:it cannot be modified and is a hexadecimal digit
currently-->test
</encryptionModel>
<UWBVersion min="1" max="32">
<!--ro, opt, string, UWB version, range:[1,32], attr:min{req, int},max{req, int}-->V1.3.4
</UWBVersion>
<audioBoard>
<!--ro, opt, object, audio board information-->
<audioBoardModel min="0" max="32">
<!--ro, opt, string, audio board model, range:[0,32], attr:min{req, int},max{req, int}, desc:currently only C8 and R8 are supported-->C8
</audioBoardModel>
<audioBoardVersion min="0" max="32">
<!--ro, opt, string, audio board version, range:[0,32], attr:min{req, int},max{req, int}-->V1.0.0 build 211210
</audioBoardVersion>
</audioBoard>
<materialScanAlgorithmVersion min="0" max="64">
<!--ro, opt, string, material scan algorithm version, range:[0,64], attr:min{req, int},max{req, int}, desc:algorithm version of imaging radar panel for
material scan-->1.0.0
</materialScanAlgorithmVersion>
<productionDate>
<!--ro, opt, date, date of manufacture-->2022-04-02
</productionDate>
<wifiModuleMACAddress min="1" max="48">
<!--ro, opt, string, Mac address of Wi-Fi module, range:[1,48], attr:min{req, int},max{req, int}-->44:47:cc:c8:d9:e4
</wifiModuleMACAddress>
<isSupportExportDeviceFingerFile>
<!--ro, opt, bool, whether the device supports exporting device fingerprint file, desc:POST /ISAPI/System/deviceInfo/ExportDeviceFingerFile?format=json-
## ->true
</isSupportExportDeviceFingerFile>
<isSupportPromptMessage>
<!--ro, opt, bool, whether the device supports configuring the device prompt information, desc:GET/PUT /ISAPI/System/deviceInfo/PromptMessage?
format=json-->true
</isSupportPromptMessage>
<shortSerialNumber min="1" max="9">
<!--ro, opt, string, short serial No., range:[1,9], attr:min{req, int},max{req, int}-->test
</shortSerialNumber>
<OSCoreVersionInfo>
<!--ro, opt, object, OS/core component version information, desc:read-only-->
Hikvision co MMC
adil@hikvision.co.az

<!--ro, opt, object, OS/core component version information, desc:read-only-->
<OSCoreVersion min="1" max="32">
<!--ro, req, string, OS/core component version No., range:[1,32], attr:min{req, int},max{req, int}-->1.0.0
</OSCoreVersion>
<minisysVersion min="1" max="32">
<!--ro, opt, string, minisys version No., range:[1,32], attr:min{req, int},max{req, int}-->1.0.0
</minisysVersion>
<networkServiceVersion min="1" max="32">
<!--ro, opt, string, network service version No., range:[1,32], attr:min{req, int},max{req, int}-->1.0.0
</networkServiceVersion>
<upgradeServiceVersion min="1" max="32">
<!--ro, opt, string, upgrade service version No., range:[1,32], attr:min{req, int},max{req, int}-->1.0.0
</upgradeServiceVersion>
</OSCoreVersionInfo>
<isSupportExportDeviceIcon>
<!--ro, opt, bool, whether the device supports exporting device icons, desc:POST /ISAPI/System/deviceInfo/ExportDeviceIcon?format=json-->true
</isSupportExportDeviceIcon>
<xTransVersion min="1" max="32">
<!--ro, opt, string, version No. of X-Trans chip communication component, range:[1,32], attr:min{req, int},max{req, int}, desc:the version number of
analyzer's chip communication component, which implements communication among network, USB, and PCIe-->1.0.0
</xTransVersion>
<isSupportSearchHardwareAssets>
<!--ro, opt, bool, whether the device supports searching for device hardware asset data, desc:POST /ISAPI/System/deviceInfo/SearchHardwareAssets?
format=json-->true
</isSupportSearchHardwareAssets>
<isSupportExportDeviceAssets>
<!--ro, opt, bool, whether the device supports exporting device asset data, desc:GET /ISAPI/System/deviceInfo/ExportDeviceAssets?format=json-->true
</isSupportExportDeviceAssets>
<screenVersionInfo>
<!--ro, opt, object, device display version information, desc:device (such as wall-mounted dock station) that has dual systems, that is embedded device
and Android system screen-->
<screenAndroidOSVersion min="1" max="64">
<!--ro, opt, string, version number of device screen's Android system, range:[1,64], attr:min{req, int},max{req, int}, desc:it is the Android kernel
version but not the Android version-->1.2.0 build20230101
</screenAndroidOSVersion>
<screenAndroidAPPVersion min="1" max="64">
<!--ro, opt, string, device screen's Android app version number, range:[1,64], attr:min{req, int},max{req, int}-->1.0.0 build20230101
</screenAndroidAPPVersion>
</screenVersionInfo>
<isSupportDeviceWebInfo>
<!--ro, opt, bool, whether the device web information is supported, desc:GET or PUT /ISAPI/System/deviceInfo/DeviceWebInfo?format=json-->true
</isSupportDeviceWebInfo>
<ptzVersion min="1" max="32">
<!--ro, opt, string, PTZ version No., attr:min{req, int},max{req, int}-->test
</ptzVersion>
<movementSoftVersion min="1" max="32">
<!--ro, opt, string, module software version, attr:min{req, int},max{req, int}-->test
</movementSoftVersion>
<movementHardVersion min="1" max="32">
<!--ro, opt, string, module hardware version, attr:min{req, int},max{req, int}-->test
</movementHardVersion>
<isSupportPipeID>
<!--ro, opt, bool, whether building pipeline (PIPEiD), desc:GET /ISAPI/System/deviceInfo/PipeID?format=json-->true
</isSupportPipeID>
<isSupportSerialNumberInURL>
<!--ro, opt, bool, whether URL supports containing serialNumber, desc:if the node is not returned, it indicates no. If true is returned, serialNumber
can be passed in URL GET or PUT /ISAPI/System/deviceInfo-->true
</isSupportSerialNumberInURL>
<loginPassword min="1" max="16">
<!--ro, opt, string, confirm password, attr:min{req, int},max{req, int}-->test
</loginPassword>
<isSupportDeviceGuideParams>
<!--ro, opt, bool, whether the device supports device guidance parameters, desc:GET or PUT /ISAPI/System/deviceInfo/DeviceGuideParams?format=json-->true
</isSupportDeviceGuideParams>
<deviceMode opt="factoryMode,maintenanceMode">
<!--ro, opt, enum, device mode, subType:string, attr:opt{req, string}, desc:"factoryMode" (factory mode), "maintenanceMode" (maintenance mode)--
>factoryMode
</deviceMode>
<maintenanceDuration min="1" max="30">
<!--ro, opt, int, range:[1,30], unit:d, attr:min{req, int},max{req, int}-->1
</maintenanceDuration>
<pirAlgorithmVersion min="0" max="32">
<!--ro, opt, string, attr:min{req, int},max{req, int}-->V1.0
</pirAlgorithmVersion>
<isSupportGetLensParams>
<!--ro, opt, bool-->true
</isSupportGetLensParams>
<deviceCabinID min="0" max="128">
<!--ro, opt, int, range:[0,128], attr:min{req, int},max{req, int}-->1
</deviceCabinID>
<detectorVersion>
<!--ro, opt, string, range:[1,32]-->test
</detectorVersion>
<isSupportSearchDeviceDistribution>
<!--ro, opt, bool-->true
</isSupportSearchDeviceDistribution>
<isSupportDeviceSubVersion>
<!--ro, opt, bool-->true
</isSupportDeviceSubVersion>
<isSupportSendDevOnPlatformInfo>
<!--ro, opt, bool-->true
</isSupportSendDevOnPlatformInfo>
<isSupportGetPortLocationInfo>
<!--ro, opt, bool-->true
Hikvision co MMC
adil@hikvision.co.az

</isSupportGetPortLocationInfo>
<isSupportDeviceServiceDescription>
<!--ro, opt, bool-->true
</isSupportDeviceServiceDescription>
<storageType opt="TF,HD">
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->TF
</storageType>
<isSupportExternalDeviceInfo>
<!--ro, opt, bool-->true
</isSupportExternalDeviceInfo>
<isSupportDeviceLongitudeLatitude>
<!--ro, opt, bool-->true
</isSupportDeviceLongitudeLatitude>
</DeviceInfo>
Request URL
GET /ISAPI/System/deviceInfo?serialNumber=<serialNumber>
## Query Parameter
Parameter NameParameter TypeDescription
serialNumberstring--
## Request Message
## None
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<DeviceInfo xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, device information, attr:version{opt, string, protocolVersion}-->
<deviceName>
<!--ro, req, string, device name, range:[0,132]-->test
</deviceName>
<deviceID>
<!--ro, req, string, device No., range:[1,128]-->test
</deviceID>
<deviceDescription>
<!--ro, opt, string, device description, range:[1,128]-->test
</deviceDescription>
<deviceLocation>
<!--ro, opt, string, device location, range:[1,128]-->hangzhou
</deviceLocation>
<deviceStatus>
<!--ro, opt, enum, device status, subType:string, desc:"normal", "abnormal"-->normal
</deviceStatus>
<DetailAbnormalStatus>
<!--ro, opt, object, error status details, desc:it is valid only when deviceStatus is "abnormal"-->
<hardDiskFull>
<!--ro, opt, bool, disk full-->true
</hardDiskFull>
<hardDiskError>
<!--ro, opt, bool, disk error-->true
</hardDiskError>
<ethernetBroken>
<!--ro, opt, bool, network disconnected-->true
</ethernetBroken>
<ipaddrConflict>
<!--ro, opt, bool, IP address conflict-->true
</ipaddrConflict>
<illegalAccess>
<!--ro, opt, bool, illegal access-->true
</illegalAccess>
<recordError>
<!--ro, opt, bool, recording exception-->true
</recordError>
<raidLogicDiskError>
<!--ro, opt, bool, virtual disk exception in the array-->true
</raidLogicDiskError>
<spareWorkDeviceError>
<!--ro, opt, bool, hot spare active device exception-->true
</spareWorkDeviceError>
</DetailAbnormalStatus>
<systemContact>
<!--ro, opt, string, manufacturer, range:[1,32]-->STD-CGI
</systemContact>
## <model>
<!--ro, req, string, device model, range:[1,64]-->iDS-9632NX-I8/X
## </model>
<serialNumber>
<!--ro, req, string, device serial No., range:[1,48]-->iDS-9632NX-I8/X1620181209CCRRC77605411WCVU
</serialNumber>
7.1.1.2 Get device information parameters
Hikvision co MMC
adil@hikvision.co.az

</serialNumber>
<macAddress>
<!--ro, req, string, MAC address, range:[1,64]-->44:47:cc:c8:d9:e4
</macAddress>
<firmwareVersion>
<!--ro, req, string, device firmware version, range:[1,64]-->V4.1.40
</firmwareVersion>
<firmwareReleasedDate>
<!--ro, opt, string, release date of the device firmware version-->2019-11-01
</firmwareReleasedDate>
<encoderVersion>
<!--ro, opt, string, device encoder version No., range:[1,32]-->V7.3
</encoderVersion>
<encoderReleasedDate>
<!--ro, opt, string, release date of the device encoder version-->2019-11-02
</encoderReleasedDate>
<bootVersion>
<!--ro, opt, string, boot version, range:[1,16]-->V1.3.4
</bootVersion>
<bootReleasedDate>
<!--ro, opt, string, release date of boot-->2019-11-03
</bootReleasedDate>
<panelVersion>
<!--ro, opt, string, panel version, range:[1,64]-->V1.0
</panelVersion>
<hardwareVersion>
<!--ro, opt, string, hardware version, range:[1,24]-->0x0
</hardwareVersion>
<decoderVersion>
<!--ro, opt, string, device decoder version, range:[1,32]-->V1.0
</decoderVersion>
<decoderReleasedDate>
<!--ro, opt, string, release date of the device decoder version-->2019-01-01
</decoderReleasedDate>
<softwareVersion>
<!--ro, opt, string, software version, range:[1,32]-->V1.23
</softwareVersion>
## <capacity>
<!--ro, opt, int, device capacity, range:[1,10240], desc:unit: MB-->1
## </capacity>
<upgradePackageMD5>
<!--ro, opt, string-->2f003d3a733bf219b7afc538ff16943d
</upgradePackageMD5>
<usedCapacity>
<!--ro, opt, int, used capacity of the device, range:[1,10240], desc:unit: MB-->1
</usedCapacity>
<subDeviceType>
<!--ro, opt, enum, device sub type, subType:string, desc:"accessControlTerminal" (access control terminal; it is valid when the value of deviceType is
"ACS"), "attendanceCheckDevice" (attendance check devices; it is valid when the value of deviceType is "ACS"), "multiChannelAccessController" (multi-channel
access controller; it is valid when the value of deviceType is "ACS"), "personAndIdCardDevice" (person and ID card device; it is valid when the value of
deviceType is "ACS"), "doorStation" (door station; it is valid when the value of deviceType is "VIS"), "indoor" (indoor station; it is valid when the value
of deviceType is "VIS"), "mainStation" (main station; it is valid when the value of deviceType is "VIS"), "dropGate" (swing barrier; it is valid when the
value of deviceType is "PersonnelChannel"), "wingGate" (flap barrier; it is valid when the value of deviceType is "PersonnelChannel"), "threeRollerGate"
(tripod turnstile; it is valid when the value of deviceType is "PersonnelChannel")-->accessControlTerminal
</subDeviceType>
<telecontrolID>
<!--ro, opt, int, remote control ID, range:[1,255]-->1
</telecontrolID>
<supportBeep>
<!--ro, opt, bool, whether it supports buzzer-->true
</supportBeep>
<supportVideoLoss>
<!--ro, opt, bool, whether it supports video loss-->true
</supportVideoLoss>
<firmwareVersionInfo>
<!--ro, opt, string, firmware version information, range:[1,32]-->B-R-H5-0
</firmwareVersionInfo>
<actualFloorNum>
<!--ro, opt, int, actual number of floors, range:[1,128]-->1
</actualFloorNum>
<localZoneNum>
<!--ro, opt, int, number of local zones, range:[0,16]-->1
</localZoneNum>
<alarmOutNum>
<!--ro, opt, int, number of alarm outputs, range:[0,16]-->1
</alarmOutNum>
<alarmInNum>
<!--ro, opt, int, number of alarm inputs, range:[0,16]-->1
</alarmInNum>
<distanceResolution>
<!--ro, opt, float, distance resolution, range:[0.000,0.999]-->0.000
</distanceResolution>
<angleResolution>
<!--ro, opt, float, angle resolution, range:[0.000,0.999]-->0.000
</angleResolution>
<speedResolution>
<!--ro, opt, float, speed resolution, range:[0.000,0.999]-->0.000
</speedResolution>
<detectDistance>
<!--ro, opt, float, detection distance, range:[0.000,0.999]-->0.000
</detectDistance>
<relayNum>
<!--ro, opt, int, number of relays (local), range:[0,16]-->1
</relayNum>
<electroLockNum>
Hikvision co MMC
adil@hikvision.co.az

<electroLockNum>
<!--ro, opt, int, number of local electronic locks, range:[0,16]-->1
</electroLockNum>
<sirenNum>
<!--ro, opt, int, number of sirens, range:[0,16]-->1
</sirenNum>
<alarmLamp>
<!--ro, opt, int, number of alarm lights, range:[0,16]-->1
</alarmLamp>
<RS485Num>
<!--ro, opt, int, number of local RS-485, range:[0,16]-->1
</RS485Num>
<radarVersion>
<!--ro, opt, string, radar version, range:[1,32]-->test
</radarVersion>
<cameraModuleVersion>
<!--ro, opt, string, camera module version, range:[1,32]-->test
</cameraModuleVersion>
## <mainversion>
<!--ro, opt, int, main version No., range:[1,255]-->1
## </mainversion>
## <subversion>
<!--ro, opt, int, sub version No., range:[1,255]-->1
## </subversion>
## <upgradeversion>
<!--ro, opt, int, updated version No., range:[1,255]-->1
## </upgradeversion>
## <customizeversion>
<!--ro, opt, int, customized version No., range:[1,255]-->1
## </customizeversion>
<companyName>
<!--ro, opt, string, manufacturer name, range:[1,32]-->test
</companyName>
## <copyright>
<!--ro, opt, string, copyright Information, range:[1,32]-->test
## </copyright>
<systemName>
<!--ro, opt, enum, storage system name, subType:string, desc:"storageManagement" (storage management system), "distributedStorageManagement"
(distributed storage management system)-->storageManagement
</systemName>
<systemStatus>
<!--ro, opt, enum, system status, subType:string, desc:"configured", "unConfigured" (not configured)-->configured
</systemStatus>
<isLeaderDevice>
<!--ro, opt, bool, whether it is the corresponding device of the resource IP address-->true
</isLeaderDevice>
<clusterVersion>
<!--ro, opt, string, system cluster version, range:[1,32], desc:this node is valid when the value of isLeaderDevice is true-->test
</clusterVersion>
<centralStorageVersion>
<!--ro, opt, string, center storage version, range:[1,16]-->test
</centralStorageVersion>
<powerOnMode>
<!--ro, opt, enum, startup mode, subType:string, desc:"button" (press button to power on), "adapter" (connect adapter to power on)-->button
</powerOnMode>
<customizedInfo>
<!--ro, opt, string, customized project No., range:[1,32], desc:no value will be returned if it is baseline device. Custom project No. will be returned
if is custom device-->test
</customizedInfo>
<verificationCode>
<!--ro, opt, string, device verification code-->test
</verificationCode>
<supportUrl>
<!--ro, opt, string, service portal-->test
</supportUrl>
<subSerialNumber>
<!--ro, opt, string, sub serial No.-->test
</subSerialNumber>
<languageType opt="chinese,english,spanish,portuguese,italian,french,russian,turkish,greek,czech,brazilianPortuguese">
<!--ro, opt, enum, language type, subType:string, attr:opt{req, string}, desc:"chinese", "english", "spanish", "portuguese", "italian", "french",
"russian", "turkish", "greek", "czech", "brazilianPortuguese", "slovenian", "swedish", "norwegian", "romanian", "danish", "german", "polish", "dutch",
"hungarian", "slovak", "serbian", "southAmericanSpanish", "ukrainian", "croatian", "irish", "bulgarian", "hebrew", "thai", "indonesian", "arabic",
"traditionalChinese", "lithuanian", "anglicism", "estonian"-->chinese
</languageType>
<DockStation>
<!--ro, opt, object, dock station information configuration-->
<Platform>
<!--ro, opt, object, information configuration of the dock station accessing the platform-->
## <ip>
<!--ro, opt, string, IP address, range:[1,32]-->test
## </ip>
## <port>
<!--ro, opt, int, communication port, range:[1,65535]-->1
## </port>
<userName>
<!--ro, req, string, user name, range:[1,32]-->test
</userName>
</Platform>
<centralStorageBackupEnabled>
<!--ro, opt, bool, whether to enable center storage backup-->true
</centralStorageBackupEnabled>
</DockStation>
<webVersion>
<!--ro, opt, string, Web version No., range:[1,32]-->test
Hikvision co MMC
adil@hikvision.co.az

<!--ro, opt, string, Web version No., range:[1,32]-->test
</webVersion>
<deviceRFProgramVersion>
<!--ro, opt, string, device RF program version, range:[1,32]-->test
</deviceRFProgramVersion>
<securityModuleSerialNo>
<!--ro, opt, string, security module serial No., range:[1,32]-->test
</securityModuleSerialNo>
<securityModuleVersion>
<!--ro, opt, string, security module version, range:[1,32]-->test
</securityModuleVersion>
<securityChipVersion>
<!--ro, opt, string, security chip version, range:[1,32]-->test
</securityChipVersion>
<securityModuleKeyVersion>
<!--ro, opt, string, security module key version, range:[1,32]-->test
</securityModuleKeyVersion>
<UIDLampRecognition>
<!--ro, opt, object, recognize the device information by UID-->
## <enabled>
<!--ro, opt, bool, whether to enable the function-->true
## </enabled>
</UIDLampRecognition>
<confDeviceIdPrefix>
<!--ro, opt, bool, whether the meeting uses the device name as its prefix-->true
</confDeviceIdPrefix>
<OEMCode>
<!--ro, opt, enum, manufacturer OME code, subType:int, desc:1 (standard device), 0 (neutral device)-->1
</OEMCode>
<simpleAlgorithmVersion>
<!--ro, opt, string, single algorithm version, desc:for fire control analyzer, it only supports one recognition algorithm if this node is returned to
the device information-->test
</simpleAlgorithmVersion>
<bootTime>
<!--ro, opt, datetime, system boot time, desc:ISO8601 time (TD format, local time and time difference)-->1970-01-01T08:00:00+08:00
</bootTime>
<intelligentAnalysisEngineModel>
<!--ro, opt, string, engine model, range:[1,32]-->test
</intelligentAnalysisEngineModel>
<marketType>
<!--ro, opt, enum, market type, subType:int, desc:0 (invalid), 1 (distribution type), 2 (industry type)-->0
</marketType>
<algorithmVersion>
<!--ro, opt, string, HCNN algorithm version, desc:its Data Dictionary is provided by research institute for matching the algorithm model-->test
</algorithmVersion>
## <firmware>
<!--ro, opt, string, firmware version, desc:its Data Dictionary is provided by research institute for matching the algorithm model-->test
## </firmware>
<engineList>
<!--ro, opt, object, list of device computing power, desc:it returns engine No. by number of GPU chips. For example, there are 3 chips whose numbers are
1, 5, and 11, then the returned values are 1, 5, 11-->
## <engine>
<!--ro, opt, int, returned engine No.-->1
## </engine>
</engineList>
## <platform>
<!--ro, opt, enum, platform type, subType:int, desc:1 (TX1), 2 (P4), 3 (3559), 4 (3519), 5 (3516)-->1
## </platform>
<platformName>
<!--ro, opt, string, the platform where the algorithm runs, desc:"TX1/K81" (NVR), "KT" (data center), "H5" (front-end device), "H7" (front-end device),
"K82" (NVR), "G3" (front-end device)-->test
</platformName>
<touchScreenVersionInfo>
<!--ro, opt, string, touch screen module version-->test
</touchScreenVersionInfo>
<protocolFileURL>
<!--ro, opt, string, protocol notice URI, range:[1,32]-->test
</protocolFileURL>
<recycleRecordEnabled>
<!--ro, opt, bool, whether to enable overwritten recording-->false
</recycleRecordEnabled>
<decordChannelNums>
<!--ro, opt, int, number of decoding channels-->0
</decordChannelNums>
<VGANums>
<!--ro, opt, int, number of VGA ports-->0
</VGANums>
<USBNums>
<!--ro, opt, int, number of USB ports-->0
</USBNums>
<auxoutNums>
<!--ro, opt, int, number of auxiliary ports-->0
</auxoutNums>
<expansionBoardVersion>
<!--ro, opt, string, extension board version information, range:[1,32]-->test
</expansionBoardVersion>
<initWizzardDisplay>
<!--ro, opt, bool, whether it displays initialization wizard, desc:it is only used for displaying configuration of applications integrated to the wizard
such as local GUI. By default, the value is true; it is false after the wizard is configured on the local GUI-->true
</initWizzardDisplay>
<beaconID>
<!--ro, opt, string, device RF program version No., range:[0,32], desc:by default, it is the current value-->test
</beaconID>
<isResetDeviceLanguage>
Hikvision co MMC
adil@hikvision.co.az

<!--ro, opt, bool, whether to reset the language, desc:only Admin and Installer have the permission to switch the device language. If the value is true,
the Hik-Connect Mobile Client and the device's web page display device information in the target language; if the value is false, the language switching
takes no effect on the Hik-Connect Mobile Client and the device's web page-->false
</isResetDeviceLanguage>
<dispalyNum>
<!--ro, opt, int, number of windows-->0
</dispalyNum>
<bspVersion>
<!--ro, opt, string, BSP software version-->test
</bspVersion>
<dspVersion>
<!--ro, opt, string, DSP software version-->test
</dspVersion>
<localUIVersion>
<!--ro, opt, string, local UI version-->test
</localUIVersion>
<OPCASubType>
<!--ro, opt, enum, sub type of optical physical and chemical analyzer, subType:string, desc:"pump", "autoSampler" (auto sampler), "detector",
"columnOven" (column oven), "SOC" (gas chromatography)-->detector
</OPCASubType>
<wiegandOutNum>
<!--ro, opt, int, number of Wiegand outputs, range:[0,1]-->1
</wiegandOutNum>
<ChipVersionInfoList>
<!--ro, opt, array, chip version information list, subType:object, range:[1,6]-->
<ChipVersionInfo>
<!--ro, opt, object, chip version information-->
## <ID>
<!--ro, req, int, chip No., range:[1,10], desc:the No.s of chips of different types can be duplicate. Users can distinguish them by chip type and
chip No. together-->1
## </ID>
<firmwareVersion>
<!--ro, req, string, chip firmware version, range:[0,64]-->1.0.0
</firmwareVersion>
<algorithmVersion>
<!--ro, opt, string, algorithm version, desc:according to the chip name to determine the specific algorithm type, such as the chip name is
temperature control system, then it is the temperature control system algorithm-->1.0.0
</algorithmVersion>
<chipName>
<!--ro, opt, string, chip name, range:[0,32], desc:N/A-->test
</chipName>
</ChipVersionInfo>
</ChipVersionInfoList>
<personBagLinkAlgoEngineVersion>
<!--ro, opt, string, engine version of the person & package linkage module, range:[0,64], desc:this node is for analyzer (security inspection)-->1.0.0
</personBagLinkAlgoEngineVersion>
<BIOSVersion>
<!--ro, opt, string, BIOS version, range:[0,16]-->V1.3.4
</BIOSVersion>
<contactInformation>
<!--ro, opt, string, contact information, range:[0,64]-->test
</contactInformation>
<temperatureModuleVersionInfo>
<!--ro, opt, string, temperature measurement component version-->test
</temperatureModuleVersionInfo>
<PedestrianWarningModuleVersion>
<!--ro, opt, object, pedestrian warning module information, desc:this node is returned only for pedestrian warning devices-->
<pedestrianWarningMCUVersion>
<!--ro, opt, string, MCU program version, range:[0,32]-->V1.3.4
</pedestrianWarningMCUVersion>
<pedestrianWarningRadarVersion>
<!--ro, opt, string, the program version of pedestrian warning radar, range:[0,32]-->V1.3.4
</pedestrianWarningRadarVersion>
<pedestrianRangingModuleVersion>
<!--ro, opt, string, the program version of the pedestrian distance measurement module, range:[0,32]-->V1.3.4
</pedestrianRangingModuleVersion>
</PedestrianWarningModuleVersion>
<encryptionModel>
<!--ro, opt, string, device encryption model, range:[0,16], desc:it cannot be modified and is a hexadecimal digit currently-->test
</encryptionModel>
<UWBVersion>
<!--ro, opt, string, UWB version, range:[1,32]-->V1.3.0
</UWBVersion>
<audioBoard>
<!--ro, opt, object, audio board information-->
<audioBoardModel>
<!--ro, opt, string, audio board model, range:[0,32], desc:currently only C8 and R8 are supported-->C8
</audioBoardModel>
<audioBoardVersion>
<!--ro, opt, string, audio board version, range:[0,32]-->V1.0.0 build 211210
</audioBoardVersion>
</audioBoard>
<materialScanAlgorithmVersion>
<!--ro, opt, string, material scanning algorithm version, range:[0,64], desc:material scanning algorithm version-->test
</materialScanAlgorithmVersion>
<regionVersion>
<!--ro, opt, enum, N/A, subType:string, desc:N/A-->basic
</regionVersion>
<productionDate>
<!--ro, opt, date, date of manufacture-->2022-04-02
</productionDate>
<wifiModuleMACAddress>
<!--ro, opt, string, Mac address of Wi-Fi module, range:[1,48]-->44:47:cc:c8:d9:e4
</wifiModuleMACAddress>
Hikvision co MMC
adil@hikvision.co.az

</wifiModuleMACAddress>
<displayInterfaceSize>
<!--ro, opt, float, display interface size, range:[0.0,16.0], unit:in, desc:diagonal length of display interface for video intercom devices-->0
</displayInterfaceSize>
<releaseRegion>
<!--ro, opt, enum, N/A, subType:string, desc:N/A-->China
</releaseRegion>
<shortSerialNumber>
<!--ro, opt, string, short serial No., range:[1,9]-->test
</shortSerialNumber>
<audioVersion>
<!--ro, opt, string, audio version, range:[1,32]-->test
</audioVersion>
<communicationFrequency>
<!--ro, opt, enum, device wireless communication frequency, subType:string, desc:"433MHz", "868MHz"-->433MHz
</communicationFrequency>
<OSCoreVersionInfo>
<!--ro, opt, object, OS/core component version information-->
<OSCoreVersion>
<!--ro, req, string, OS/core component version No., range:[1,32]-->1.0.0
</OSCoreVersion>
<minisysVersion>
<!--ro, opt, string, minisys version No., range:[1,32]-->1.0.0
</minisysVersion>
<networkServiceVersion>
<!--ro, opt, string, network service version No., range:[1,32]-->1.0.0
</networkServiceVersion>
<upgradeServiceVersion>
<!--ro, opt, string, upgrade service version No., range:[1,32]-->1.0.0
</upgradeServiceVersion>
</OSCoreVersionInfo>
<xTransVersion>
<!--ro, opt, string, version No. of xtrans chip communication component, range:[1,32], desc:this node is for analyzer-->1.0.0
</xTransVersion>
<deviceMaintenanceInfoQRCode>
<!--ro, opt, string, Get the QR code of the device maintenance information., range:[0,64], desc:scan to get more device information, including
maintenance and documentation materials-->test
</deviceMaintenanceInfoQRCode>
<batteryFirmwareVersion>
<!--ro, opt, string, battery firmware version No., range:[1,32]-->1.0.0
</batteryFirmwareVersion>
<radarVideoMapInfoList>
<!--ro, opt, array, information list of radar-assisted video coordinate conversion matrix, subType:object, range:[1,32], desc:multiple cameras are added
as sub-devices by terminal device(the transmission solution of sub-devices is adopted, refer to Sub-device Transparent Transmission in the Video Channel
Resource Management domain). Each camera has its own radar-assisted video coordinate conversion matrix table, while the terminal device has multiple ones
corresponding to each camera. When getting the terminal device information parameters via GET /ISAPI/System/deviceInfo, an information list of multiple
matrix tables of the terminal device is returned. When getting the camera information parameters via GET /ISAPI/System/deviceInfo?devIndex=<devIndex>, the
matrix table information of the specified camera is returned-->
<radarVideoMapInfo>
<!--ro, opt, object, radar-assisted video coordinate conversion matrix information-->
<devIndex>
<!--ro, opt, string, sub-device ID, range:[0,64], desc:used for corresponding sub device-->123456789
</devIndex>
<radarVideoMapVersion>
<!--ro, opt, string, radar-assisted video coordinate conversion matrix version, range:[1,32], desc:video coordinate and map GPS conversion matrix
version-->1.0.0
</radarVideoMapVersion>
</radarVideoMapInfo>
</radarVideoMapInfoList>
<screenVersionInfo>
<!--ro, opt, object, device screen version information, desc:the device (such as wall-mounted dock station) is a dual-system device, that is, an
embedded device and an Android system screen-->
<screenAndroidOSVersion>
<!--ro, opt, string, Android system version number of device screen, range:[1,64], desc:system program based on Android kernel,-->1.2.0 build20230101
</screenAndroidOSVersion>
<screenAndroidAPPVersion>
<!--ro, opt, string, Android application version number of device screen, range:[1,64]-->1.0.0 build20230101
</screenAndroidAPPVersion>
</screenVersionInfo>
<isSupportBattery>
<!--ro, opt, bool, whether the device supports battery installing, desc:if the node is not returned or the returned value is false, it indicates no--
## >true
</isSupportBattery>
<networkConfigSettingEnabled>
<!--ro, opt, bool, whether to enter the network configuration interface after login, desc:application scenario: the default device IP address is
192.168.0.100, which is different from the network segment or IP address of the field environment. This is because it is a static IP address, and the
default IP address cannot be accessed on the local area network. The network cable is directly connected to the device. The technical support can open the
device web page to check if the IP address is the default IP address 192.168.0.100. If it is default IP address, the network configuration interface will be
auto displayed for IP address configuration. When it is true, it indicates that you will enter the configuration page after login. When it is false or does
not exist, the login follows the previous logic-->true
</networkConfigSettingEnabled>
<ptzVersion>
<!--ro, opt, string, PTZ version number, range:[1,32]-->test
</ptzVersion>
<movementSoftVersion>
<!--ro, opt, string, module software version number, range:[1,32]-->test
</movementSoftVersion>
<movementHardVersion>
<!--ro, opt, string, module hardware version number, range:[1,32]-->test
</movementHardVersion>
<loraModuleList>
<!--ro, opt, array, Lora module information list, subType:object-->
<loraModule>
<!--ro, opt, object, Lora module information-->
Hikvision co MMC
adil@hikvision.co.az

<!--ro, opt, object, Lora module information-->
## <id>
<!--ro, opt, int, sequence number, desc:currently only one-->1
## </id>
<firmwareVersion>
<!--ro, opt, string, firmware version, range:[1,64]-->test
</firmwareVersion>
</loraModule>
</loraModuleList>
<deviceMode>
<!--ro, opt, enum, device mode, subType:string, desc:"factoryMode", "maintenanceMode"-->factoryMode
</deviceMode>
<maintenanceDuration>
<!--ro, opt, int, maintenance mode duration, range:[1,30], unit:d, dep:and,{$.DeviceInfo.deviceMode,eq,maintenance}-->1
</maintenanceDuration>
<pirAlgorithmVersion>
<!--ro, opt, string, PIR algorithm version No., range:[1,32]-->V1.0
</pirAlgorithmVersion>
<customSerialNumber>
<!--ro, opt, string, range:[1,9]-->B0000021
</customSerialNumber>
<deviceCabinID>
<!--ro, opt, int, range:[0,128]-->1
</deviceCabinID>
<detectorVersion>
<!--ro, opt, string, range:[1,32]-->test
</detectorVersion>
<internalModel>
<!--ro, opt, string, range:[1,64]-->DS-AT1000S-2U4U
</internalModel>
<batteryFirmwareCodeVersion>
<!--ro, opt, string, range:[1,32]-->12345
</batteryFirmwareCodeVersion>
<batteryFirmwareSerialNumber>
<!--ro, opt, string, range:[1,32]-->DS-2FGHASKGHKWUHBGKAHSKG
</batteryFirmwareSerialNumber>
<mainModulePictureUrl>
<!--ro, opt, string-->test
</mainModulePictureUrl>
<mainModuleDialUpPictureUrl>
<!--ro, opt, string-->test
</mainModuleDialUpPictureUrl>
<controlInfo>
<!--ro, opt, object-->
<controlType>
<!--ro, req, enum, subType:string-->single
</controlType>
<singleControlInfo>
<!--ro, opt, object, dep:or,{$.DeviceInfo.controlInfo.controlType,eq,single}-->
<serialMatchState>
<!--ro, opt, enum, subType:string-->match
</serialMatchState>
</singleControlInfo>
<doubleControlInfo>
<!--ro, opt, object, dep:or,{$.DeviceInfo.controlInfo.controlType,eq,double}-->
<controlInfoList>
<!--ro, req, array, subType:object, range:[2,2]-->
<controlInfo>
<!--ro, opt, object-->
<childDevID>
<!--ro, req, string, range:[9,32]-->12345
</childDevID>
## <role>
<!--ro, opt, enum, subType:string-->main
## </role>
</controlInfo>
</controlInfoList>
<supportModuleList>
<!--ro, opt, array, subType:object-->
<supportModule>
<!--ro, opt, enum, subType:string-->interfaces
</supportModule>
</supportModuleList>
</doubleControlInfo>
</controlInfo>
<opticalFiberNumber>
<!--ro, opt, int, range:[1,10]-->10
</opticalFiberNumber>
<devMaterialNumber>
<!--ro, opt, string-->336800009
</devMaterialNumber>
<middlePlateMCUVersion>
<!--ro, opt, string-->test
</middlePlateMCUVersion>
<panelMCUVersion>
<!--ro, opt, string-->test
</panelMCUVersion>
<middlePlateCPLDVersion>
<!--ro, opt, string-->test
</middlePlateCPLDVersion>
<backboardCPLDVersion>
<!--ro, opt, string-->test
</backboardCPLDVersion>
<DFDVersion>
<!--ro, opt, string-->test
Hikvision co MMC
adil@hikvision.co.az

<!--ro, opt, string-->test
</DFDVersion>
<CPUModel>
<!--ro, opt, enum, subType:string-->K51
</CPUModel>
<deviceAssembleType>
<!--ro, opt, enum, subType:string-->endDevice
</deviceAssembleType>
<deviceCategory>
<!--ro, opt, enum, subType:string-->thermometryDevice
</deviceCategory>
<storageType>
<!--ro, opt, enum, subType:string-->TF
</storageType>
## <role>
<!--ro, opt, enum, subType:string-->managementNode
## </role>
<SRRCModel>
<!--ro, opt, string-->ACS-A-U-07-002-A
</SRRCModel>
</DeviceInfo>
Request URL
PUT /ISAPI/System/deviceInfo?serialNumber=<serialNumber>
## Query Parameter
Parameter NameParameter TypeDescription
serialNumberstring--
## Request Message
<?xml version="1.0" encoding="UTF-8"?>
<DeviceInfo xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, device information, attr:version{opt, string, protocolVersion}-->
<deviceName>
<!--req, string, device name, range:[1,132]-->test
</deviceName>
<deviceID>
<!--opt, string, device No., range:[1,128]-->test
</deviceID>
<deviceDescription>
<!--opt, string, device description, range:[1,128]-->test
</deviceDescription>
<deviceLocation>
<!--opt, string, device location, range:[1,128]-->hangzhou
</deviceLocation>
<deviceStatus>
<!--ro, opt, enum, device status, subType:string, desc:"normal", "abnormal"-->normal
</deviceStatus>
<DetailAbnormalStatus>
<!--ro, opt, object, error status details, desc:it is valid only when deviceStatus is "abnormal"-->
<hardDiskFull>
<!--ro, opt, bool, disk full-->true
</hardDiskFull>
<hardDiskError>
<!--ro, opt, bool, disk error-->true
</hardDiskError>
<ethernetBroken>
<!--ro, opt, bool, network disconnected-->true
</ethernetBroken>
<ipaddrConflict>
<!--ro, opt, bool, IP address conflict-->true
</ipaddrConflict>
<illegalAccess>
<!--ro, opt, bool, illegal access-->true
</illegalAccess>
<recordError>
<!--ro, opt, bool, recording exception-->true
</recordError>
<raidLogicDiskError>
<!--ro, opt, bool, virtual disk exception in the array-->true
</raidLogicDiskError>
<spareWorkDeviceError>
<!--ro, opt, bool, hot spare active device exception-->true
</spareWorkDeviceError>
</DetailAbnormalStatus>
<systemContact>
<!--ro, opt, string, manufacturer, range:[1,32]-->STD-CGI
</systemContact>
## <model>
<!--ro, req, string, device model, range:[1,64]-->iDS-9632NX-I8/X
## </model>
<serialNumber>
7.1.1.3 Set device information parameters
Hikvision co MMC
adil@hikvision.co.az

<serialNumber>
<!--ro, req, string, device serial No., range:[1,48]-->iDS-9632NX-I8/X1620181209CCRRC77605411WCVU
</serialNumber>
<macAddress>
<!--ro, req, string, MAC Address, range:[1,64]-->44:47:cc:c8:d9:e4
</macAddress>
<firmwareVersion>
<!--ro, req, string, device firmware version, range:[1,64]-->V4.1.40
</firmwareVersion>
<firmwareReleasedDate>
<!--ro, opt, string, release date of the device firmware version-->2019-11-01
</firmwareReleasedDate>
<encoderVersion>
<!--ro, opt, string, device encoder version No., range:[1,32]-->V7.3
</encoderVersion>
<encoderReleasedDate>
<!--ro, opt, string, release date of the device encoder version-->2019-11-02
</encoderReleasedDate>
<bootVersion>
<!--ro, opt, string, boot version, range:[1,16]-->V1.3.4
</bootVersion>
<bootReleasedDate>
<!--ro, opt, string, release date of boot-->2019-11-03
</bootReleasedDate>
<panelVersion>
<!--ro, opt, string, panel version, range:[1,32]-->V1.0
</panelVersion>
<hardwareVersion>
<!--ro, opt, string, hardware version, range:[1,16]-->0x0
</hardwareVersion>
<decoderVersion>
<!--ro, opt, string, device decoder version, range:[1,32]-->V1.0
</decoderVersion>
<decoderReleasedDate>
<!--ro, opt, string, release date of the device decoder version-->2019-01-01
</decoderReleasedDate>
<softwareVersion>
<!--ro, opt, string, software version, range:[1,32]-->V1.23
</softwareVersion>
## <capacity>
<!--ro, opt, int, device capacity, range:[1,10240], desc:unit: MB-->1
## </capacity>
<usedCapacity>
<!--ro, opt, int, used capacity of the device, range:[1,10240], desc:unit: MB-->1
</usedCapacity>
<telecontrolID>
<!--opt, int, remote control ID, range:[1,255]-->1
</telecontrolID>
<supportBeep>
<!--ro, opt, bool, whether to support buzzer-->true
</supportBeep>
<supportVideoLoss>
<!--ro, opt, bool, whether the device supports video loss-->true
</supportVideoLoss>
<firmwareVersionInfo>
<!--ro, opt, string, firmware version information, range:[1,32]-->test
</firmwareVersionInfo>
<actualFloorNum>
<!--ro, opt, int, actual number of floors, range:[1,128]-->1
</actualFloorNum>
<localZoneNum>
<!--ro, opt, int, number of zones (local), range:[0,16]-->1
</localZoneNum>
<alarmOutNum>
<!--ro, opt, int, number of alarm outputs, range:[0,16]-->1
</alarmOutNum>
<distanceResolution>
<!--ro, opt, float, distance resolution, range:[0.000,0.999]-->0.000
</distanceResolution>
<angleResolution>
<!--ro, opt, float, angle resolution, range:[0.000,0.999]-->0.000
</angleResolution>
<speedResolution>
<!--ro, opt, float, speed resolution, range:[0.000,0.999]-->0.000
</speedResolution>
<detectDistance>
<!--ro, opt, float, detection distance, range:[0.000,0.999]-->0.000
</detectDistance>
<relayNum>
<!--ro, opt, int, number of relays (local), range:[0,16]-->1
</relayNum>
<electroLockNum>
<!--ro, opt, int, number of locks (local), range:[0,16]-->1
</electroLockNum>
<sirenNum>
<!--ro, opt, int, number of sirens, range:[0,16]-->1
</sirenNum>
<alarmLamp>
<!--ro, opt, int, number of alarm lamps, range:[0,16]-->1
</alarmLamp>
<RS485Num>
<!--ro, opt, int, number of local 485, range:[0,16]-->1
</RS485Num>
<radarVersion>
Hikvision co MMC
adil@hikvision.co.az

<radarVersion>
<!--ro, opt, string, radar version, range:[1,32]-->test
</radarVersion>
<cameraModuleVersion>
<!--ro, opt, string, camera modulo version, range:[1,32]-->test
</cameraModuleVersion>
## <mainversion>
<!--ro, opt, int, main version No., range:[1,255]-->1
## </mainversion>
## <subversion>
<!--ro, opt, int, sub version No., range:[1,255]-->1
## </subversion>
## <upgradeversion>
<!--ro, opt, int, update version No., range:[1,255]-->1
## </upgradeversion>
## <customizeversion>
<!--ro, opt, int, custom version No., range:[1,255]-->1
## </customizeversion>
<companyName>
<!--ro, opt, string, manufacturer name, range:[1,32]-->test
</companyName>
## <copyright>
<!--ro, opt, string, version information, range:[1,32]-->test
## </copyright>
<systemName>
<!--ro, opt, enum, storage system name, subType:string, desc:"storageManagement" (storage management system), "distributedStorageManagement"
(distributed storage management system)-->storageManagement
</systemName>
<systemStatus>
<!--ro, opt, enum, system status, subType:string, desc:"configured", "unConfigured" (not configured)-->configured
</systemStatus>
<isLeaderDevice>
<!--ro, opt, bool, whether it is the corresponding device of the resource IP address-->true
</isLeaderDevice>
<clusterVersion>
<!--ro, opt, string, cluster version, range:[1,32], desc:it is valid when isLeaderDevice returns true-->test
</clusterVersion>
<centralStorageVersion>
<!--ro, opt, string, center storage version, range:[1,16]-->test
</centralStorageVersion>
<powerOnMode>
<!--ro, opt, enum, startup mode, subType:string, desc:"button" (press button to power on), "adapter" (connect adapter to power on)-->button
</powerOnMode>
<customizedInfo>
<!--ro, opt, string, custom project No., range:[1,32], desc:no value will be returned if it is baseline device. Custom project No. will be returned if
is custom device-->test
</customizedInfo>
<verificationCode>
<!--ro, opt, string, device verification code-->test
</verificationCode>
<supportUrl>
<!--ro, opt, string, service portal-->test
</supportUrl>
<subSerialNumber>
<!--ro, opt, string, sub serial No.-->test
</subSerialNumber>
<languageType opt="chinese,english,spanish,portuguese,italian,french,russian,turkish,greek,czech,brazilianPortuguese">
<!--ro, opt, enum, language type, subType:string, attr:opt{req, string}, desc:"chinese", "english", "spanish", "portuguese", "italian", "french",
"russian", "turkish", "greek", "czech", "brazilianPortuguese", "slovenian", "swedish", "norwegian", "romanian", "danish", "german", "polish", "dutch",
"hungarian", "slovak", "serbian", "southAmericanSpanish", "ukrainian", "croatian", "irish", "bulgarian", "hebrew", "thai", "indonesian", "arabic",
"traditionalChinese"-->chinese
</languageType>
<DockStation>
<!--ro, opt, object, dock station configuration-->
<Platform>
<!--ro, opt, object, information configuration of the dock station accessing the platform-->
## <ip>
<!--ro, opt, string, IP address, range:[1,32]-->test
## </ip>
## <port>
<!--ro, opt, int, communication port, range:[1,65535]-->1
## </port>
<userName>
<!--ro, req, string, user name, range:[1,32]-->test
</userName>
## <password>
<!--ro, req, string, password, range:[1,16]-->test
## </password>
</Platform>
<centralStorageBackupEnabled>
<!--ro, opt, bool, whether to enable central storage backup-->true
</centralStorageBackupEnabled>
</DockStation>
<webVersion>
<!--ro, opt, string, Web version No., range:[1,32]-->test
</webVersion>
<deviceRFProgramVersion>
<!--ro, opt, string, device RF program version, range:[1,32]-->test
</deviceRFProgramVersion>
<securityModuleSerialNo>
<!--ro, opt, string, security module serial No., range:[1,32]-->test
</securityModuleSerialNo>
<securityModuleVersion>
<!--ro, opt, string, security module version, range:[1,32]-->test
</securityModuleVersion>
Hikvision co MMC
adil@hikvision.co.az

</securityModuleVersion>
<securityChipVersion>
<!--ro, opt, string, security chip version, range:[1,32]-->test
</securityChipVersion>
<securityModuleKeyVersion>
<!--ro, opt, string, security module key version, range:[1,32]-->test
</securityModuleKeyVersion>
<UIDLampRecognition>
<!--ro, opt, object, recognize the device information by UID-->
## <enabled>
<!--ro, opt, bool, whether to enable the function-->true
## </enabled>
</UIDLampRecognition>
<confDeviceIdPrefix>
<!--ro, opt, bool, whether the meeting uses the device name as its prefix-->true
</confDeviceIdPrefix>
<OEMCode>
<!--ro, opt, enum, manufacturer OME code, subType:int, desc:1 (standard device), 0 (neutral device)-->1
</OEMCode>
<simpleAlgorithmVersion>
<!--ro, opt, string, single algorithm version, desc:for fire control analyzer, it only supports one recognition algorithm if this node is returned to
the device information-->test
</simpleAlgorithmVersion>
<bootTime>
<!--ro, opt, datetime, system boot time-->1970-01-01T00:00:00+08:00
</bootTime>
<intelligentAnalysisEngineModel>
<!--ro, opt, string, engine model, range:[1,32]-->test
</intelligentAnalysisEngineModel>
<marketType>
<!--ro, opt, enum, market type, subType:int, desc:0 (invalid), 1 (distribution type), 2 (industry type)-->0
</marketType>
<algorithmVersion>
<!--ro, opt, string, HCNN algorithm version, desc:its Data Dictionary is provided by research institute for matching the algorithm model-->test
</algorithmVersion>
## <firmware>
<!--ro, opt, string, firmware version, desc:its Data Dictionary is provided by research institute for matching the algorithm model-->test
## </firmware>
<engineList>
<!--ro, opt, object, list of device computing power, desc:it returns engine No. by the number of GPU chips. For example, there are 3 chips whose numbers
are 1, 5, and 11, then the returned values are 1, 5, 11-->
## <engine>
<!--ro, opt, int, returned engine No.-->1
## </engine>
</engineList>
## <platform>
<!--ro, opt, enum, platform type, subType:int, desc:1 (TX1), 2 (P4), 3 (3559), 4 (3519), 5 (3516)-->1
## </platform>
<platformName>
<!--ro, opt, string, the platform where the algorithm runs, desc:TX1/K81: NVR, KT: data center,H5: front-end device, H7: front-end device, K82: NVR, G3:
front-end device-->test
</platformName>
<touchScreenVersionInfo>
<!--ro, opt, string, touch screen module version-->test
</touchScreenVersionInfo>
<protocolFileURL>
<!--ro, opt, string, protocol notice URI, range:[1,32]-->test
</protocolFileURL>
<recycleRecordEnabled>
<!--ro, opt, bool, whether to enable overwritten recording-->false
</recycleRecordEnabled>
<decordChannelNums>
<!--ro, opt, int, number of decoding channels-->0
</decordChannelNums>
<VGANums>
<!--ro, opt, int, number of VGA ports-->0
</VGANums>
<USBNums>
<!--ro, opt, int, number of USB ports-->0
</USBNums>
<auxoutNums>
<!--ro, opt, int, number of auxiliary ports-->0
</auxoutNums>
<expansionBoardVersion>
<!--ro, opt, string, extension board version information, range:[1,32]-->test
</expansionBoardVersion>
<initWizzardDisplay>
<!--ro, opt, bool, whether it displays initialization wizard, desc:it is only used for displaying configuration of applications integrated to the
wizard, such as local GUI and Hik-Connect app by default, the value is true. it is false after the local GUI configures the wizard-->true
</initWizzardDisplay>
<beaconID>
<!--ro, opt, string, device RF program version No., range:[0,32], desc:by default, it is the current value-->test
</beaconID>
<isResetDeviceLanguage>
<!--ro, opt, bool, whether it supports resetting the device language, desc:only Admin and Installer have the permission to switch the device language.
If the value is true, the Hik-Connect Mobile Client and the device's web page display device information in the target language; if the value is false, the
language switching takes no effect on the Hik-Connect Mobile Client and the device's web page-->false
</isResetDeviceLanguage>
<dispalyNum>
<!--ro, opt, int, number of windows-->0
</dispalyNum>
<bspVersion>
<!--ro, opt, string, BSP software version-->test
</bspVersion>
Hikvision co MMC
adil@hikvision.co.az

</bspVersion>
<dspVersion>
<!--ro, opt, string, DSP software version-->test
</dspVersion>
<localUIVersion>
<!--ro, opt, string, local UI version-->test
</localUIVersion>
<detectorType>
<!--ro, opt, enum, detector type, subType:string, desc:"PDA" (photo-diode array)-->PDA
</detectorType>
<wiegandOutNum>
<!--ro, opt, int, number of Wiegand outputs, range:[0,1]-->1
</wiegandOutNum>
<ChipVersionInfoList>
<!--ro, opt, array, subType:object, range:[1,6]-->
<ChipVersionInfo>
<!--ro, opt, object-->
## <ID>
<!--ro, req, int, range:[0,1]-->1
## </ID>
<firmwareVersion>
<!--ro, req, string, range:[0,64]-->1.0.0
</firmwareVersion>
</ChipVersionInfo>
</ChipVersionInfoList>
<personBagLinkAlgoEngineVersion>
<!--ro, opt, string, engine version of the person & package linkage module, range:[0,64], desc:this node is for analyzer (security inspection)-->1.0.0
</personBagLinkAlgoEngineVersion>
<BIOSVersion>
<!--ro, opt, string, BIOS version, range:[0,16]-->test
</BIOSVersion>
<contactInformation>
<!--ro, opt, string, contact information, range:[0,64]-->test
</contactInformation>
<materialScanAlgorithmVersion>
<!--opt, string, material scan algorithm version, range:[0,64], desc:algorithm version of imaging radar panel for material scan-->test
</materialScanAlgorithmVersion>
<audioVersion>
<!--ro, opt, string, range:[1,32]-->test
</audioVersion>
<loginPassword>
<!--opt, string, range:[1,16]-->test
</loginPassword>
<deviceMode>
<!--opt, enum, subType:string-->factoryMode
</deviceMode>
<maintenanceDuration>
<!--opt, int, range:[1,30], unit:d, dep:and,{$.DeviceInfo.deviceMode,eq,maintenance}-->1
</maintenanceDuration>
<deviceCabinID>
<!--opt, int, range:[0,128]-->1
</deviceCabinID>
</DeviceInfo>
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, response message, attr:version{ro, req, string}-->
<requestURL>
<!--ro, opt, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
(Invalid XML Content), 7 (Reboot Required)-->0
</statusCode>
<statusString>
<!--ro, req, enum, status description, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
"Invalid XML Content", "Reboot Required" (reboot device)-->OK
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code-->OK
</subStatusCode>
## <description>
<!--ro, opt, string, range:[0,1024]-->badXmlFormat
## </description>
<MErrCode>
<!--ro, opt, string-->0x00000000
</MErrCode>
<MErrDevSelfEx>
<!--ro, opt, string-->0x00000000
</MErrDevSelfEx>
</ResponseStatus>
## 7.1.2 Event Subscription Management
7.1.2.1 Set alarm/event subscription parameters
Hikvision co MMC
adil@hikvision.co.az

Request URL
PUT /ISAPI/Event/notification/subscribeEvent/<subscribeEventID>
## Query Parameter
Parameter NameParameter TypeDescription
subscribeEventIDstring--
## Request Message
<?xml version="1.0" encoding="UTF-8"?>
<SubscribeEvent xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--req, object, picture uploading modes of all events which contain pictures, attr:version{req, string, protocolVersion}-->
## <heartbeat>
<!--opt, int, heartbeat interval, range:[1,180], unit:s-->1
## </heartbeat>
<channelMode>
<!--opt, enum, channel subscription mode, subType:string, desc:"all"(upload all alarms/events), "list"(upload specified alarm/event)-->list
</channelMode>
<eventMode>
<!--req, enum, "all"-upload all alarms/events,"list"-upload specified alarm/event, subType:string, desc:"all"(upload all alarms/events), "list"(upload
specified alarm/event)-->list
</eventMode>
<EventList>
<!--opt, array, event type list for subscription, subType:object, desc:this node is valid when eventMode is "list"-->
<Event>
<!--opt, object, uploading mode of specified alarm/event-->
## <type>
<!--req, enum, alarm/event types, subType:string, desc:see details in event types: "ADAS"(advanced driving assistance system), "ADASAlarm"(advanced
driving assistance alarm), "AID"(traffic incident detection), "ANPR"(automatic number plate recognition), "AccessControllerEvent", "CDsStatus", "DBD"
(driving behavior detection) "GPSUpload", "HFPD"(frequently appeared person), "IO"(I/O Alarm), "IOTD", "LES", "LFPD"(low frequency person detection),
"PALMismatch", "PIR", "PeopleCounting", "PeopleNumChange", "Standup"(standing up detection), "TMA"(thermometry alarm), "TMPA"(temperature measurement pre-
alarm), "VMD"(motion detection), "abnormalAcceleration", "abnormalDriving", "advReachHeight", "alarmResult", "attendance", "attendedBaggage",
"audioAbnormal", "audioexception", "behaviorResult"(abnormal event detection), "blindSpotDetection"(blind spot detection alarm), "cardMatch",
"changedStatus", "collision", "containerDetection", "crowdSituationAnalysis", "databaseException", "defocus"(defocus detection), "diskUnformat"(disk
unformatted), "diskerror", "diskfull", "driverConditionMonitor"(driver status monitoring alarm); "emergencyAlarm", "faceCapture", "faceSnapModeling",
"facedetection", "failDown"(People Falling Down), "faultAlarm", "fielddetection"(intrusion detection), "fireDetection", "fireEscapeDetection",
"flowOverrun", "framesPeopleCounting", "getUp"(getting up detection), "group" (people gathering), "hdBadBlock"(HDD bad sector detection event), "hdImpact"
(HDD impact detection event), "heatmap"(heat map alarm), "highHDTemperature"(HDD high temperature detection event), "highTempAlarm"(HDD high temperature
alarm), "hotSpare"(hot spare exception), "illaccess"(invalid access), "ipcTransferAbnormal", "ipconflict"(IP address conflicts), "keyPersonGetUp"(key person
getting up detection), "leavePosition"(absence detection), "linedetection"(line crossing detection), "listSyncException"(list synchronization exception),
"loitering"(loitering detection), "lowHDTemperature"(HDD low temperature detection event), "mixedTargetDetection"(multi-target-type detection),
"modelError", "nicbroken"(network disconnected), "nodeOffline"(node disconnected), "nonPoliceIntrusion", "overSpeed"(overspeed alarm), "overtimeTarry"
(staying overtime detection), "parking"(parking detection), "peopleNumChange", "peopleNumCounting", "personAbnormalAlarm"(person ID exception alarm),
"personDensityDetection", "personQueueCounting", "personQueueDetection", "personQueueRealTime"(real-time data of people queuing-up detection),
"personQueueTime"(waiting time detection), "playCellphone"(playing mobile phone detection), "pocException"(video exception), "poe"(POE power exception),
"policeAbsent", "radarAlarm", "radarFieldDetection", "radarLineDetection", "radarPerimeterRule"(radar rule data), "radarTargetDetection",
"radarVideoDetection"(radar-assisted target detection), "raidException", "rapidMove", "reachHeight"(climbing detection), "recordCycleAbnormal"(insufficient
recording period), "recordException", "regionEntrance", "regionExiting", "retention"(people overstay detection), "rollover", "running"(people running),
"safetyHelmetDetection"(hard hat detection), "scenechangedetection", "sensorAlarm"(angular acceleration alarm), "severeHDFailure"(HDD major fault
detection), "shelteralarm"(video tampering alarm), "shipsDetection", "sitQuietly"(sitting detection), "smokeAndFireDetection", "smokeDetection", "softIO",
"spacingChange"(distance exception), "sysStorFull"(storaging full alarm of cluster system), "takingElevatorDetection"(elevator electric moped detection),
"targetCapture", "temperature"(temperature difference alarm), "thermometry"(temperature alarm), "thirdPartyException", "toiletTarry"(in-toilet overtime
detection), "tollCodeInfo"(QR code information report), "tossing"(thrown object detection), "unattendedBaggage", "vehicleMatchResult"(uploading list
alarms), "vehicleRcogResult", "versionAbnormal"(cluster version exception), "videoException", "videoloss", "violationAlarm", "violentMotion"(violent motion
detection), "yardTarry"(playground overstay detection), "AccessControllerEvent", "IDCardInfoEvent", "FaceTemperatureMeasurementEvent", "QRCodeEvent"(QR code
event of access control), "CertificateCaptureEvent"(person ID capture comparison event), "UncertificateCompareEvent",
"ConsumptionAndTransactionRecordEvent", "ConsumptionEvent", "TransactionRecordEvent", "SetMealQuery"(searching consumption set meals),
"ConsumptionStatusQuery"(searching the consumption status), "humanBodyComparison"-->mixedTargetDetection
## </type>
<minorAlarm>
<!--opt, string, minor alarm type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event is
"AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorAlarm>
<minorException>
<!--opt, string, minor exception type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event
is "AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorException>
<minorOperation>
<!--opt, string, operation sub type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event is
"AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorOperation>
<minorEvent>
<!--opt, string, event sub type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event is
"AccessControllerEvent"-->0x01,0x02,0x03,0x04
</minorEvent>
<pictureURLType>
<!--opt, enum, alarm picture format, subType:string, desc:"binary" (binary), "localURL" (device local URL), "cloudStorageURL" (cloud storage URL)--
>cloudStorageURL
</pictureURLType>
## <channels>
<!--opt, string, channel information linked to event, desc:event linked channel information,and multiple channels can be linked,each channel is
separated by comma,e.g.,"1,2,3,4..."-->1,2,3,4
## </channels>
<ConferenceIDList>
<!--opt, array, video conference ID list, subType:object, desc:when this node does not exist, it indicates to subscribe to all conferences-->
<ConferenceID>
Hikvision co MMC
adil@hikvision.co.az

<ConferenceID>
<!--opt, string, ID of subscribed video conference, range:[1,32]-->test
</ConferenceID>
</ConferenceIDList>
<uploadAllTarget>
<!--opt, bool, whether to upload all detected targets, desc:the default value is false. In perimeter protection, this node is used for NVR to get
all targets detected by the network camera-->false
</uploadAllTarget>
<uploadMEFData>
<!--opt, bool, whether to upload the electronic fence data related to the event, desc:true by default-->true
</uploadMEFData>
<minorType>
<!--opt, enum, event sub-type, subType:string, desc:"success", "failed"-->success
</minorType>
<childDevIDList>
<!--opt, array, subType:object-->
<childDevID>
<!--opt, string, range:[1,128]-->test
</childDevID>
</childDevIDList>
<radarChannels>
<!--opt, string-->1,2,3,4
</radarChannels>
<audioChannels>
<!--opt, string-->1,2,3,4
</audioChannels>
</Event>
</EventList>
## <channels>
<!--opt, string, event linked channel information,and multiple channels can be linked,each channel is separated by comma,e.g.,"1,2,3,4...", desc:event
linked channel information,and multiple channels can be linked,each channel is separated by comma,e.g.,"1,2,3,4..."-->1,2,3,4
## </channels>
<pictureURLType>
<!--opt, enum, alarm picture format, subType:string, desc:"binary"(binary), "localURL"(device local URL), "cloudStorageURL"(cloud storage URL)--
>cloudStorageURL
</pictureURLType>
<ChangedUploadSub>
<!--opt, object, subscribe to the uploaded information of device status changed event-->
## <interval>
<!--opt, int, the lifecycle of arming GUID, range:[1,300], unit:s, desc:5 minute (default). If GUID is not reconnected in the internal, a new GUID
will be generated since the device starts a new arm period-->300
## </interval>
<StatusSub>
<!--opt, object, status description-->
## <all>
<!--opt, bool, whether to subscribe to the changing status of all channels, HDDs, and capability sets-->false
## </all>
## <channel>
<!--opt, bool, status of subscribed channels, desc:reporting is not required if all is true-->true
## </channel>
## <hd>
<!--opt, bool, subscribe to HDD status, desc:reporting is not required if all is true-->true
## </hd>
## <capability>
<!--opt, bool, subscribe to changing status of capability set, desc:reporting is not required if all is true-->true
## </capability>
<ChanStatus>
<!--ro, opt, object, channel status subscription of uploaded device status changed event, desc:it is valid when the value of <channel> is true. When
this node does not exist, it indicates to upload all channel status changes. For example, the recording status is uploaded frequently, and the platform
focuses more on the device online status and arming status, thus the recording status needs to be unsubscribed-->
## <online>
<!--ro, opt, bool, whether the channel online status is subscribed, desc:if this node does not exist, it indicates there will be no related alarm-
## ->true
## </online>
## <record>
<!--ro, opt, bool, whether the recording status (the device is recording) is subscribed, desc:if this node does not exist, it indicates there will
be no related alarm-->true
## </record>
<recordStatus>
<!--ro, opt, bool, whether the recording status is subscribed, desc:if this node does not exist, it indicates there will be no related alarm--
## >true
</recordStatus>
## <signal>
<!--ro, opt, bool, whether the signal status is subscribed, desc:if this node does not exist, it indicates there will be no related alarm-->true
## </signal>
## <arming>
<!--ro, opt, bool, whether the camera arming status (armed by NVR) is subscribed, desc:if this node does not exist, it indicates there will be no
related alarm-->true
## </arming>
</ChanStatus>
</StatusSub>
</ChangedUploadSub>
<identityKey>
<!--opt, string, subscription connection interaction key, range:[1,64], desc:N/A-->test
</identityKey>
<ConferenceIDList>
<!--opt, array, video conference ID list, subType:object-->
<ConferenceID>
<!--opt, string, ID of subscribed video conference, range:[1,32]-->test
</ConferenceID>
</ConferenceIDList>
## <level>
<!--opt, enum, arming level, subType:string, desc:"high" (default value), "middle", "low"-->high
## </level>
Hikvision co MMC
adil@hikvision.co.az

## </level>
<middleLevelPictureEnabeld>
<!--opt, bool, whether to enable picture uploading for middle-level arming, desc:the default value is true-->true
</middleLevelPictureEnabeld>
<childDevIDList>
<!--opt, array, subType:object-->
<childDevID>
<!--opt, string, range:[1,128]-->test
</childDevID>
</childDevIDList>
<radarChannels>
<!--opt, string-->1,2,3,4
</radarChannels>
<qosLevel>
<!--ro, opt, object-->
<defaultLevel>
<!--ro, req, enum, subType:int-->0
</defaultLevel>
<eventList>
<!--ro, opt, array, subType:object-->
## <event>
<!--ro, opt, object-->
<eventType>
<!--ro, req, string, range:[0,64]-->test
</eventType>
## <level>
<!--ro, req, enum, subType:int-->1
## </level>
## <channels>
<!--ro, opt, string, range:[0,256]-->0,1,2
## </channels>
## </event>
</eventList>
</qosLevel>
<audioChannels>
<!--opt, string-->1,2,3,4
</audioChannels>
</SubscribeEvent>
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
<requestURL>
<!--ro, req, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
(Invalid XML Content), 7 (Reboot Required)-->0
</statusCode>
<statusString>
<!--ro, req, enum, status description, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
"Invalid XML Content", "Reboot" (reboot device)-->OK
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code-->OK
</subStatusCode>
## <description>
<!--ro, opt, string, range:[0,1024]-->badXmlFormat
## </description>
</ResponseStatus>
Request URL
GET /ISAPI/Event/notification/subscribeEvent/<subscribeEventID>
## Query Parameter
## Parameter
## Name
## Parameter
## Type
## Description
subscribeEventIDstring
When an event/alarm is subscribed (related URL: POST
/ISAPI/Event/notification/subscribeEvent), the (subscription ID) will be returned in
message SubscribeEventResponse. When an event/alarm is subscribed (related URL:
POST /ISAPI/Event/notification/subscribeEvent), and if subscribeEventID is applied, it
can be used to replace the in SubscribeEventResponse.
## Request Message
7.1.2.2 Get alarm/event subscription parameters
Hikvision co MMC
adil@hikvision.co.az

## None
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<SubscribeEvent xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, picture uploading modes of all events which contain pictures, attr:version{req, string, protocolVersion}-->
## <heartbeat>
<!--ro, opt, int, heartbeat interval time, range:[1,180], unit:s-->1
## </heartbeat>
<channelMode>
<!--ro, opt, enum, channel subscription mode, subType:string, desc:"all" (subscribe to all channels), "list" (subscribe to channels according to channel
list)-->list
</channelMode>
<eventMode>
<!--ro, req, enum, event subscription mode, subType:string, desc:"all" (subscribe to all alarms/events), "list" (subscribe to specified alarms/events)--
## >list
</eventMode>
<EventList>
<!--ro, opt, array, event type list for subscription, subType:object, desc:this node is valid when eventMode is "list"-->
<Event>
<!--ro, opt, object, subscription of a specified alarm/event-->
## <type>
<!--ro, req, enum, event type, subType:string, desc:alarm/event types, which are obtained from the capability, refer to Alarm/Event Types
(eventType)-->mixedTargetDetection
## </type>
<minorAlarm>
<!--ro, opt, string, minor alarm type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event
is "AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorAlarm>
<minorException>
<!--ro, opt, string, minor exception type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of
event is "AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorException>
<minorOperation>
<!--ro, opt, string, minor operation type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of
event is "AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorOperation>
<minorEvent>
<!--ro, opt, string, minor event type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event
is "AccessControllerEvent"-->0x01,0x02,0x03,0x04
</minorEvent>
<pictureURLType>
<!--ro, opt, enum, alarm picture format, subType:string, desc:"binary" (binary), "localURL" (device local URL), "cloudStorageURL" (cloud storage
URL)-->cloudStorageURL
</pictureURLType>
## <channels>
<!--ro, opt, string, channel information linked to event, desc:it supports multiple channels, which are separated by commas-->1,2,3,4
## </channels>
<ConferenceIDList>
<!--ro, opt, array, video conference ID list, subType:object, desc:when this node does not exist, it indicates to subscribe to all conferences-->
<ConferenceID>
<!--ro, opt, string, ID of subscribed video conference, range:[1,32]-->test
</ConferenceID>
</ConferenceIDList>
<uploadAllTarget>
<!--ro, opt, bool, whether to upload all detected targets, desc:the default value is false. In perimeter protection, this node is used for NVR to
get all targets detected by the network camera-->false
</uploadAllTarget>
<uploadMEFData>
<!--ro, opt, bool, whether to upload the electronic fence data related to the event, desc:true by default-->true
</uploadMEFData>
<minorType>
<!--ro, opt, enum, event sub-type, subType:string, desc:"success", "failed"-->success
</minorType>
<childDevIDList>
<!--ro, opt, array, subType:object-->
<childDevID>
<!--ro, opt, string, range:[1,128]-->test
</childDevID>
</childDevIDList>
<radarChannels>
<!--ro, opt, string-->1,2,3,4
</radarChannels>
<audioChannels>
<!--ro, opt, string-->1,2,3,4
</audioChannels>
<childDeviceFormat>
<!--ro, opt, bool-->true
</childDeviceFormat>
</Event>
</EventList>
## <channels>
<!--ro, opt, string, unified arming of all channels, desc:if this node is applied, <channels> in <Event> will be invalid. If the value of <channelMode>
is all, this node should not be applied-->1,2,3,4
## </channels>
<pictureURLType>
<!--ro, opt, enum, format unified configuration of alarm pictures, subType:string, desc:"binary", "localURL" (device local URL), "cloudStorageURL"
(cloud storage URL). The node indicates the upload mode of all event pictures. If the node is applied, the <pictureURLType> of the <Event> will be invalid.
If the node is not applied, the pictures are uploaded in the default mode. The default data type of uploaded pictures for front-end devices is binary, and
for back-end devices is local URL of the device-->cloudStorageURL
Hikvision co MMC
adil@hikvision.co.az

for back-end devices is local URL of the device-->cloudStorageURL
</pictureURLType>
<ChangedUploadSub>
<!--ro, opt, object, subscribe to the uploaded information of device status changed event-->
## <interval>
<!--ro, opt, int, the lifecycle of arming GUID, range:[1,300], unit:s, desc:the default value is 5 (unit: minute). Within the interval, if the client
software does not reconnect to the device, a new GUID will be generated by the device-->300
## </interval>
<StatusSub>
<!--ro, opt, object, status description-->
## <all>
<!--ro, opt, bool, whether to subscribe to all channels, HDDs, and capability set changes-->false
## </all>
## <channel>
<!--ro, opt, bool, channel subscription status (whether the channel is subscribed), desc:it is not required if the value of <all> is true-->true
## </channel>
## <hd>
<!--ro, opt, bool, HDD subscription status (whether the HDD is subscribed), desc:it is not required if the value of <all> is true-->true
## </hd>
## <capability>
<!--ro, opt, bool, subscription status of capability set change (whether the capability set change is subscribed), desc:it is not required if the
value of <all> is true-->true
## </capability>
<ChanStatus>
<!--ro, opt, object, channel status subscription of uploaded device status changed event, desc:it is valid when the value of <channel> is true. When
this node does not exist, it indicates to upload all channel status changes. For example, the recording status is uploaded frequently, and the platform
focuses more on the device online status and arming status, thus the recording status needs to be unsubscribed-->
## <online>
<!--ro, opt, bool, whether the channel online status is subscribed, desc:if this node does not exist, it indicates there will be no related alarm-
## ->true
## </online>
## <record>
<!--ro, opt, bool, whether the recording status (the device is recording) is subscribed, desc:if this node does not exist, it indicates there will
be no related alarm-->true
## </record>
<recordStatus>
<!--ro, opt, bool, whether the recording status is subscribed, desc:if this node does not exist, it indicates there will be no related alarm--
## >true
</recordStatus>
## <signal>
<!--ro, opt, bool, whether the signal status is subscribed, desc:if this node does not exist, it indicates there will be no related alarm-->true
## </signal>
## <arming>
<!--ro, opt, bool, whether the camera arming status (armed by NVR) is subscribed, desc:if this node does not exist, it indicates there will be no
related alarm-->true
## </arming>
</ChanStatus>
</StatusSub>
</ChangedUploadSub>
<identityKey>
<!--ro, opt, string, subscription connection interaction key, range:[1,64], desc:N/A-->test
</identityKey>
<ConferenceIDList>
<!--ro, opt, array, video conference ID list, subType:object-->
<ConferenceID>
<!--ro, opt, string, ID of subscribed video conference, range:[1,32]-->test
</ConferenceID>
</ConferenceIDList>
## <level>
<!--ro, opt, enum, arming level, subType:string, desc:"high" (default value), "middle", "low"-->high
## </level>
<middleLevelPictureEnabeld>
<!--ro, opt, bool, whether to enable picture uploading for middle-level arming, desc:the default value is true-->true
</middleLevelPictureEnabeld>
<childDevIDList>
<!--ro, opt, array, subType:object-->
<childDevID>
<!--ro, opt, string, range:[1,128]-->test
</childDevID>
</childDevIDList>
<radarChannels>
<!--ro, opt, string-->1,2,3,4
</radarChannels>
<qosLevel>
<!--ro, opt, object-->
<defaultLevel>
<!--ro, req, enum, subType:int-->0
</defaultLevel>
<eventList>
<!--ro, opt, array, subType:object-->
## <event>
<!--ro, opt, object-->
<eventType>
<!--ro, req, string, range:[0,64]-->test
</eventType>
## <level>
<!--ro, req, enum, subType:int-->1
## </level>
## <channels>
<!--ro, opt, string, range:[0,256]-->0,1,2
## </channels>
## </event>
</eventList>
</qosLevel>
Hikvision co MMC
adil@hikvision.co.az

<audioChannels>
<!--ro, opt, string-->1,2,3,4
</audioChannels>
<retransmissionID>
<!--ro, opt, string, range:[1,64]-->123456
</retransmissionID>
<retransmissionTimeoutDuration>
<!--ro, opt, int, range:[1,168], unit:h-->1
</retransmissionTimeoutDuration>
<SubscribeISAPIMessage>
<!--ro, opt, object-->
<EventTypeList>
<!--ro, req, array, subType:object-->
<eventType>
<!--ro, req, enum, subType:string-->AIOP_Video
</eventType>
<uploadPicEnabled>
<!--ro, opt, bool-->false
</uploadPicEnabled>
</EventTypeList>
<EventList>
<!--ro, req, array, subType:object, range:[0,200]-->
<Event>
<!--ro, opt, object-->
<eventType>
<!--ro, req, enum, subType:string-->AIOP_Video
</eventType>
<uploadPicEnabled>
<!--ro, opt, bool-->false
</uploadPicEnabled>
</Event>
</EventList>
</SubscribeISAPIMessage>
</SubscribeEvent>
Request URL
GET /ISAPI/Event/notification/subscribeEventCap
## Query Parameter
## None
## Request Message
## None
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<SubscribeEventCap xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, picture uploading modes of all events which contain pictures, attr:version{req, string, protocolVersion}-->
<format opt="xml,json">
<!--ro, opt, string, supported message data format, attr:opt{req, string}-->xml
## </format>
<heartbeat min="1" max="180">
<!--ro, opt, int, heartbeat interval time, range:[1,180], unit:s, attr:min{req, int},max{req, int}-->1
## </heartbeat>
<channelMode opt="all,list">
<!--ro, opt, enum, channel subscription mode, subType:string, attr:opt{req, string}, desc:"all" (subscribe to all channels), "list" (subscribe to
channels according to channel list)-->list
</channelMode>
<eventMode opt="all,list,allAndChild">
<!--ro, req, enum, event subscription mode, subType:string, attr:opt{req, string}, desc:"all" (subscribe to all alarms/events), "list" (subscribe to
specified alarms/events)-->list
</eventMode>
<EventList>
<!--ro, opt, array, event type list for subscription, subType:object, desc:this node is valid when eventMode is "list"-->
<Event>
<!--ro, opt, object, subscription of a specified alarm/event-->
## <type>
<!--ro, req, enum, event type, subType:string, desc:refer to event type list (eventType): "ADAS"(advanced driving assistance system), "ADASAlarm"
(advanced driving assistance alarm), "AID"(traffic incident detection), "ANPR"(automatic number plate recognition), "AccessControllerEvent" (access
controller event), "CDsStatus" (CD burning status), "DBD"(driving behavior detection) "GPSUpload" (GPS information upload), "HFPD"(frequently appeared
person detection), "IO"(I/O alarm), "IOTD" (IoT device detection), "LES" (logistics scanning event), "LFPD"(rarely appeared person detection), "PALMismatch"
(video standard mismatch), "PIR", "PeopleCounting" (people counting), "PeopleNumChange" (people number change detection), "Standup"(standing up detection),
"TMA"(thermometry alarm), "TMPA"(temperature measurement pre-alarm), "VMD"(motion detection), "abnormalAcceleration", "abnormalDriving", "advReachHeight",
"alarmResult", "attendance", "attendedBaggage", "audioAbnormal", "audioexception", "behaviorResult"(abnormal event detection), "blindSpotDetection"(blind
spot detection alarm), "cardMatch", "changedStatus", "collision", "containerDetection", "crowdSituationAnalysis", "databaseException", "defocus"(defocus
detection), "diskUnformat"(disk unformatted), "diskerror", "diskfull", "driverConditionMonitor"(driver status monitoring alarm); "emergencyAlarm",
"faceCapture", "faceSnapModeling", "facedetection", "failDown"(People Falling Down), "faultAlarm", "fielddetection"(intrusion detection), "fireDetection",
"fireEscapeDetection", "flowOverrun", "framesPeopleCounting", "getUp"(getting up detection), "group" (people gathering), "hdBadBlock"(HDD bad sector
detection event), "hdImpact"(HDD impact detection event), "heatmap"(heat map alarm), "highHDTemperature"(HDD high temperature detection event),
"highTempAlarm"(HDD high temperature alarm), "hotSpare"(hot spare exception), "illaccess"(invalid access), "ipcTransferAbnormal", "ipconflict"(IP address
conflicts), "keyPersonGetUp"(key person getting up detection), "leavePosition"(absence detection), "linedetection"(line crossing detection),
"listSyncException"(list synchronization exception), "loitering"(loitering detection), "lowHDTemperature"(HDD low temperature detection event),
7.1.2.3 Get the alarm/event subscription capability
Hikvision co MMC
adil@hikvision.co.az

"listSyncException"(list synchronization exception), "loitering"(loitering detection), "lowHDTemperature"(HDD low temperature detection event),
"mixedTargetDetection"(multi-target-type detection), "modelError", "nicbroken"(network disconnected), "nodeOffline"(node disconnected),
"nonPoliceIntrusion", "overSpeed"(overspeed alarm), "overtimeTarry"(staying overtime detection), "parking"(parking detection), "peopleNumChange",
"peopleNumCounting", "personAbnormalAlarm"(person ID exception alarm), "personDensityDetection", "personQueueCounting", "personQueueDetection",
"personQueueRealTime"(real-time data of people queuing-up detection), "personQueueTime"(waiting time detection), "playCellphone"(playing mobile phone
detection), "pocException"(video exception), "poe"(POE power exception), "policeAbsent", "radarAlarm", "radarFieldDetection", "radarLineDetection",
"radarPerimeterRule"(radar rule data), "radarTargetDetection", "radarVideoDetection"(radar-assisted target detection), "raidException", "rapidMove",
"reachHeight"(climbing detection), "recordCycleAbnormal"(insufficient recording period), "recordException", "regionEntrance", "regionExiting", "retention"
(people overstay detection), "rollover", "running"(people running), "safetyHelmetDetection"(hard hat detection), "scenechangedetection", "sensorAlarm"
(angular acceleration alarm), "severeHDFailure"(HDD major fault detection), "shelteralarm"(video tampering alarm), "shipsDetection", "sitQuietly"(sitting
detection), "smokeAndFireDetection", "smokeDetection", "softIO", "spacingChange"(distance exception), "sysStorFull"(storaging full alarm of cluster system),
"takingElevatorDetection"(elevator electric moped detection), "targetCapture", "temperature"(temperature difference alarm), "thermometry"(temperature
alarm), "thirdPartyException", "toiletTarry"(in-toilet overtime detection), "tollCodeInfo"(QR code information report), "tossing"(thrown object detection),
"unattendedBaggage", "vehicleMatchResult"(uploading list alarms), "vehicleRcogResult", "versionAbnormal"(cluster version exception), "videoException",
"videoloss", "violationAlarm", "violentMotion"(violent motion detection), "yardTarry"(playground overstay detection), "AccessControllerEvent",
"IDCardInfoEvent", "FaceTemperatureMeasurementEvent", "QRCodeEvent"(QR code event of access control), "CertificateCaptureEvent"(person ID capture comparison
event), "UncertificateCompareEvent", "ConsumptionAndTransactionRecordEvent", "ConsumptionEvent", "TFS" (traffic enforcement event),
"TransactionRecordEvent", "HealthInfoSyncQuery" (health information search event), "SetMealQuery"(searching consumption set meals), "ConsumptionStatusQuery"
(searching the consumption status), "certificateRevocation" (certificate expiry), "humanBodyComparison" (human body comparison),
"regionTargetNumberCounting" (regional target statistics)-->mixedTargetDetection
## </type>
<minorAlarm opt="0x400,0x401,0x402,0x403">
<!--ro, opt, string, minor alarm type, attr:opt{req, string}, desc:"IDCardInfoEvent" is required when the type of event is "AccessControllerEvent"--
## >0x400,0x401
</minorAlarm>
<minorException opt="0x400,0x401,0x402,0x403">
<!--ro, opt, string, minor exception type, attr:opt{req, string}, desc:"IDCardInfoEvent" is required when the type of event is
"AccessControllerEvent"-->0x400,0x401
</minorException>
<minorOperation opt="0x400,0x401,0x402,0x403">
<!--ro, opt, string, minor operation type, attr:opt{req, string}, desc:"IDCardInfoEvent" is required when the type of event is
"AccessControllerEvent"-->0x400,0x401
</minorOperation>
<minorEvent opt="0x01,0x02,0x03,0x04">
<!--ro, opt, string, minor event type, attr:opt{req, string}, desc:"IDCardInfoEvent" is required when the type of event is "AccessControllerEvent"--
## >0x400,0x401
</minorEvent>
<pictureURLType opt="binary,localURL,cloudStorageURL,multipart" def="cloudStorageURL">
<!--ro, opt, enum, alarm picture format, subType:string, attr:opt{req, string},def{req, string}, desc:"binary" (binary), "localURL" (device local
URL), "cloudStorageURL" (cloud storage URL)-->cloudStorageURL
</pictureURLType>
## <channels>
<!--ro, opt, string, channel information linked to event, desc:it supports multiple channels, which are separated by commas-->1,2,3,4
## </channels>
<ConferenceIDList size="1">
<!--ro, opt, array, video conference ID list, subType:object, attr:size{req, int}, desc:when this node does not exist, it indicates to subscribe to
all conferences-->
<ConferenceID min="1" max="32">
<!--ro, opt, string, ID of subscribed video conference, range:[1,32], attr:min{req, int},max{req, int}-->test
</ConferenceID>
</ConferenceIDList>
<uploadAllTarget opt="true,false">
<!--ro, opt, bool, whether to upload all detected targets, attr:opt{req, string}, desc:the default value is false. In perimeter protection, this
node is used for NVR to get all targets detected by the network camera-->false
</uploadAllTarget>
<uploadMEFData opt="true,false">
<!--ro, opt, bool, whether to upload the electronic fence data related to the event, attr:opt{req, string}, desc:true by default-->true
</uploadMEFData>
<minorType opt="success,failed">
<!--ro, opt, string, event sub-type, attr:opt{req, string},
desc:1. It is valid when the value of <type> is "CertificateCaptureEvent" or "ncertificateCompareEvent".
- There is the requirement to only subscribe to the failure or success of an event, for example, security inspection at the railway station and the hotel
check-in.-->success
</minorType>
<childDevIDList min="1" max="8">
<!--ro, opt, array, (sub-device local identifier) device serial No. list, subType:object, attr:min{req, int},max{req, int}, desc:arm sub device
## (sensor)-->
<childDevID min="1" max="128">
<!--ro, opt, string, (sub-device local identifier) device serial No. list, range:[1,128], attr:min{req, int},max{req, int}, desc:arm sub device
## (sensor)-->test
</childDevID>
</childDevIDList>
<radarChannels>
<!--ro, opt, string, radar channel arming capability, desc:it supports multiple channels, which are separated by commas-->1,2,3,4
</radarChannels>
<audioChannels>
<!--ro, opt, string, audio channel arming capability, desc:it supports multiple channels, which are separated by commas-->1,2,3,4
</audioChannels>
<childDeviceFormat opt="true,false">
<!--ro, opt, bool, upload event by sub device, attr:opt{req, string}-->true
</childDeviceFormat>
<unitChannels>
<!--ro, opt, string, optical fiber channel arming capability of device, desc:it supports multiple channels, which are separated by commas-->1,2,3,4
</unitChannels>
</Event>
</EventList>
## <channels>
<!--ro, opt, string, unified arming of all channels, desc:if this node is applied, <channels> in <Event> will be invalid. If the value of <channelMode>
is all, this node should not be applied. To arm a part of channels, you can list the channel numbers. Multiple channels are separated by commas-->1,2,3,4
## </channels>
<pictureURLType opt="binary,localURL,cloudStorageURL,multipart" def="cloudStorageURL">
<!--ro, opt, enum, format unified configuration of alarm pictures, subType:string, attr:opt{req, string},def{req, string}, desc:"binary", "localURL"
(device local URL), "cloudStorageURL" (cloud storage URL). The node indicates the upload mode of all event pictures. If the node is applied, the
<pictureURLType> of the <Event> will be invalid. If the node is not applied, the pictures are uploaded in the default mode. The default data type of
uploaded pictures for front-end devices is binary, and for back-end devices is local URL of the device-->cloudStorageURL
Hikvision co MMC
adil@hikvision.co.az

uploaded pictures for front-end devices is binary, and for back-end devices is local URL of the device-->cloudStorageURL
</pictureURLType>
<ChangedUploadSub>
<!--ro, opt, object, subscribe to the uploaded information of device status changed event-->
## <interval>
<!--ro, opt, int, the lifecycle of arming GUID, range:[1,300], unit:s, desc:the default value is 5 (unit: minute). Within the interval, if the client
software does not reconnect to the device, a new GUID will be generated by the device-->300
## </interval>
<StatusSub>
<!--ro, opt, bool, status information-->true
## <all>
<!--ro, opt, bool, whether to subscribe to the changing status of all channels, HDDs, and capability sets-->false
## </all>
## <channel>
<!--ro, opt, bool, status of subscribed channels, desc:reporting is not required if all is true-->true
## </channel>
## <hd>
<!--ro, opt, bool, subscribe to HDD status, desc:reporting is not required if all is true-->true
## </hd>
## <capability>
<!--ro, opt, bool, subscribe to changing status of capability set, desc:reporting is not required if all is true-->true
## </capability>
<ChanStatus>
<!--ro, opt, object, channel status subscription of uploaded device status changed event, desc:it is valid when the value of <channel> is true. When
this node does not exist, it indicates to upload all channel status changes. For example, the recording status is uploaded frequently, and the platform
focuses more on the device online status and arming status, thus the recording status needs to be unsubscribed-->
<online opt="true,false">
<!--ro, opt, bool, whether the channel online status is subscribed, attr:opt{req, string}, desc:if this node does not exist, it indicates there
will be no related alarm-->true
## </online>
<record opt="true,false">
<!--ro, opt, bool, whether the recording status (the device is recording) is subscribed, attr:opt{req, string}, desc:if this node does not exist,
it indicates there will be no related alarm-->true
## </record>
<recordStatus opt="true,false">
<!--ro, opt, bool, whether the recording status is subscribed, attr:opt{req, string}, desc:if this node does not exist, it indicates there will be
no related alarm-->true
</recordStatus>
<signal opt="true,false">
<!--ro, opt, bool, whether the signal status is subscribed, attr:opt{req, string}, desc:if this node does not exist, it indicates there will be no
related alarm-->true
## </signal>
<arming opt="true,false">
<!--ro, opt, bool, whether the camera arming status (armed by NVR) is subscribed, attr:opt{req, string}, desc:if this node does not exist, it
indicates there will be no related alarm-->true
## </arming>
</ChanStatus>
</StatusSub>
</ChangedUploadSub>
<identityKey max="64">
<!--ro, opt, string, subscription connection interaction key, range:[1,64], attr:max{req, int}, desc:N/A-->test
</identityKey>
<ConferenceIDList size="1">
<!--ro, opt, array, video conference ID list, subType:object, attr:size{req, int}-->
<ConferenceID min="1" max="32">
<!--ro, opt, string, ID of subscribed video conference, range:[1,32], attr:min{req, int},max{req, int}-->test
</ConferenceID>
</ConferenceIDList>
<isSupportModifySubscribeEvent>
<!--ro, opt, bool, whether the device supports the management of arming subscription, desc:related API: /ISAPI/Event/notification/subscribeEvent/<ID>--
## >true
</isSupportModifySubscribeEvent>
<subscribeEventID min="1" max="128">
<!--ro, opt, string, custom subscription ID. The platform should guarantee the uniqueness of ID when applying it. The automatic network replenishment of
events will be enabled by default after the node is applied, range:[1,128], attr:min{req, int},max{req, int}, desc:when an event/alarm is subscribed
(related URL: POST /ISAPI/Event/notification/subscribeEvent), if this node is applied, it can be used to replace <id> (subscription ID) returned in message
SubscribeEventResponse-->test
</subscribeEventID>
<level opt="high,middle,low">
<!--ro, opt, enum, arming level, subType:string, attr:opt{req, string}, desc:"high" (default value), "middle", "low"-->high
## </level>
<middleLevelPictureEnabeld opt="true,false">
<!--ro, opt, bool, whether to enable picture uploading for middle-level arming, attr:opt{req, string}, desc:the default value is true-->true
</middleLevelPictureEnabeld>
<deployID opt="1,2">
<!--ro, opt, enum, arming type, subType:int, attr:opt{req, string}, desc:0 (by client software), 1 (real-time)-->0
</deployID>
<childDevIDList min="1" max="8">
<!--ro, opt, array, (sub-device local identifier) device serial No. list, subType:object, attr:min{req, int},max{req, int}, desc:arm sub device
## (sensor)-->
<childDevID min="1" max="128">
<!--ro, opt, string, (sub-device local identifier) device serial No. list, range:[1,128], attr:min{req, int},max{req, int}, desc:arm sub device
## (sensor)-->test
</childDevID>
</childDevIDList>
<SubscribeISAPIMessage>
<!--ro, opt, object-->
<eventType opt="AIOP_Video,AIOP_Polling_Video,AIOP_Picture,AIOP_Polling_Snap,TPS">
<!--ro, req, enum, subType:string, attr:opt{req, string}-->AIOP_Video
</eventType>
<eventPicUploadType opt="AIOP_Picture">
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->AIOP_Picture
</eventPicUploadType>
<EventList>
Hikvision co MMC
adil@hikvision.co.az

<EventList>
<!--ro, opt, object, event list-->
<Event>
<!--ro, opt, object, a single event-->
<eventType opt="AIOP_Video,AIOP_Polling_Video,AIOP_Picture,AIOP_Polling_Snap,TPS,audioexception">
<!--ro, req, enum, subType:string, attr:opt{req, string}-->AIOP_Video
</eventType>
<eventPicUploadType opt="AIOP_Picture">
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->AIOP_Picture
</eventPicUploadType>
</Event>
</EventList>
</SubscribeISAPIMessage>
<radarChannels>
<!--ro, opt, string, if this field is applied, radarChannels in Event will not take effect. To arm all radar channels, this field should not be applied.
To arm a part of channels, you can list the channel numbers. Multiple channels are separated by commas, desc:if this field is applied, radarChannels in
Event will not take effect. To arm all radar channels, this field should not be applied. To arm a part of channels, you can list the channel numbers.
Multiple channels are separated by commas-->1,2,3,4
</radarChannels>
<qosLevel>
<!--ro, opt, object, subscription events qos level, desc:subscription events qos level-->
<defaultLevel opt="0,1,2">
<!--ro, req, enum, default qos level, subType:int, attr:opt{req, string}, desc:default qos level-->0
</defaultLevel>
<eventList>
<!--ro, opt, array, custom event qos level list, subType:object-->
## <event>
<!--ro, opt, object, custom event qos level-->
<eventType>
<!--ro, req, string, event type, range:[0,64], desc:its values refer to event types of different domains-->test
</eventType>
<level opt="0,1,2">
<!--ro, req, enum, qos level of this event type, subType:int, attr:opt{req, string}, desc:qos level of this event type-->1
## </level>
## <channels>
<!--ro, opt, string, video resource channel No., range:[0,256], desc:no such node means it applies to all channels; otherwise it applies to the
channels listed in the array, and channels not listed use default qos level-->0,1,2
## </channels>
## </event>
</eventList>
</qosLevel>
<isSupportUnSubscribeEvent>
<!--ro, opt, bool, whether the device supports canceling arming subscription-->true
</isSupportUnSubscribeEvent>
<audioChannels>
<!--ro, opt, string, audio channel arming capability, desc:it supports multiple channels, which are separated by commas-->1,2,3,4
</audioChannels>
<unitChannels>
<!--ro, opt, string, batch arming capability of optical fiber channel, desc:if this field is applied, unitChannels in Event will not take effect. To arm
all fiber channels, this node should not be applied. To arm a part of channels, you can list the channel numbers. Multiple channels are separated by commas-
## ->1,2,3,4
</unitChannels>
<retransmissionID min="1" max="64">
<!--ro, opt, string, ANR arming ID, range:[1,64], attr:min{req, int},max{req, int}, desc:UUID, which is unique and generated by the platform-->123456
</retransmissionID>
<retransmissionTimeoutDuration min="1" max="168" def="168">
<!--ro, opt, int, data transmission timeout for ANR, unit:h, attr:min{req, int},max{req, int},def{req, int}, desc:data transmission timeout for ANR-->0
</retransmissionTimeoutDuration>
<isSupportRetransmissionStatus>
<!--ro, opt, bool-->true
</isSupportRetransmissionStatus>
<isSupportCancelRetransmission>
<!--ro, opt, bool-->true
</isSupportCancelRetransmission>
<isSupportSubscribeWithoutPic>
<!--ro, opt, bool-->true
</isSupportSubscribeWithoutPic>
</SubscribeEventCap>
Request URL
POST /ISAPI/ContentMgmt/logSearch
## Query Parameter
## None
## Request Message
## 7.1.3 Log Management
7.1.3.1 Search for log information
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<CMSearchDescription xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--req, object, log search, attr:version{opt, string, protocolVersion}-->
<searchID>
<!--req, string, search ID, range:[1,32], desc:UUID/GUID for record search. It is used to check whether the current search requester is the same as the
previous one. If they are the same, the search record will be stored in the device for faster search next time.-->test
</searchID>
<trackIDList>
<!--opt, array, channel list, subType:object-->
<trackID>
<!--req, int, channel No., desc:channel No.-->1
</trackID>
</trackIDList>
<metaId>
<!--req, enum, log type, subType:string, desc:{log.std-cgi.com/<majorType>/<minorType>}, <majorType>-major type of log, <minorType>-minor type of log,
see remarks for detailed log type definitions; "log.std-cgi.com/Alarm/methaneConcentrationException", "log.std-
cgi.com/Alarm/methaneLightIntensityException", "log.std-cgi.com/Alarm/fishingShipDetection"-->log.std-cgi.com/Alarm/methaneConcentrationException
</metaId>
<timeSpanList>
<!--opt, array, list of time periods, subType:object, desc:list of time periods-->
<timeSpan>
<!--opt, object, time period, desc:time period-->
<startTime>
<!--req, datetime, start time-->1970-01-01T00:00:00Z
</startTime>
<endTime>
<!--req, datetime, end time-->1970-01-01T01:00:00Z
</endTime>
</timeSpan>
</timeSpanList>
<searchResultPostion>
<!--opt, int, the start position of the search result, desc:the start position of the search result in the result list-->100
</searchResultPostion>
<maxResults>
<!--opt, int, the maximum number of records supported in this search, range:[0,100]-->0
</maxResults>
<onlySmart>
<!--opt, bool, whether to search for logs with smart information, desc:the value of this node is false by default-->false
</onlySmart>
<logLevel>
<!--opt, enum, subType:string-->emergency
</logLevel>
<alarmLevel>
<!--opt, enum, subType:string-->high
</alarmLevel>
</CMSearchDescription>
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<CMSearchResult xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, log search result, attr:version{opt, string, protocolVersion}-->
<searchID>
<!--ro, req, string, search ID, range:[1,32], desc:UUID/GUID for record search. It is used to check whether the current search requester is the same as
the previous one. If they are the same, the search record will be stored in the device for faster search next time-->test
</searchID>
<responseStatus>
<!--ro, req, bool, search status-->true
</responseStatus>
<responseStatusStrg>
<!--ro, req, enum, search status string, subType:string, desc:"OK" (search completed), "NO MATCHES" (no matched data), "MORE" (more data waiting to be
searched)-->OK
</responseStatusStrg>
<totalMatches>
<!--ro, opt, int, total number of matched results-->12
</totalMatches>
<numOfMatches>
<!--ro, opt, int, number of results returned this time, range:[0,100]-->24
</numOfMatches>
<matchList>
<!--ro, opt, array, list of matched data records, subType:object-->
<searchMatchItem>
<!--ro, opt, object, single matched record-->
<logDescriptor>
<!--ro, opt, object, log description-->
<metaId>
<!--ro, req, string, log type for search, desc:log.std-cgi.com/<majorType>/<minorType>, "<majorType>" (major type of log), "<minorType>" (minor
type of log), see remarks for detailed log type definitions-->log.std-cgi.com/Alarm/24HZoneAlarm
</metaId>
<StartDateTime>
<!--ro, req, datetime, log time-->1970-01-01T00:30:00Z
</StartDateTime>
<localID>
<!--ro, opt, string, channel No.-->1
</localID>
<paraType>
<!--ro, opt, string, parameter type-->test
Hikvision co MMC
adil@hikvision.co.az

</paraType>
<userName>
<!--ro, opt, string, user name-->Admin
</userName>
<infoContent>
<!--ro, opt, string, log information content-->test
</infoContent>
<logInfo>
<!--ro, opt, object, log information-->
<OpenDoorRecord>
<!--ro, opt, object, video intercom unlocking record-->
## <type>
<!--ro, req, enum, unlocking type, subType:string, desc:"password" (unlocking by password), "hijack" (unlocking by duress), "card" (unlocking
by card), "resident" (unlocking by resident), "center" (unlocking by management center)-->password
## </type>
</OpenDoorRecord>
<VisAlarmRecord>
<!--ro, opt, object, video intercom alarm record-->
## <type>
<!--ro, req, enum, alarm type, subType:string, desc:"zone" (zone alarm), "dismantle" (tampering alarm), "hijack" (duress alarm), "passwordErr"
(password error alarm), "doorNotOpen" (unlocking-door-failed alarm), "doorNotClose" (locking-door-failed alarm), "SOS" (SOS alarm), "callReq" (device call
request alarm), "smartLockHijackFingerPrint" (smart lock duress alarm (fingerprint)), ‘smartLockHijackPassword" (smart lock duress alarm (password)),
"smartLockBreaking" (forced-open door alarm), "smartLockBeLocked" (lock-up door alarm), "smartLockLowBattery" (smart-lock-battery-low alarm)-->zone
## </type>
</VisAlarmRecord>
</logInfo>
<ipAddress>
<!--ro, opt, string, device IP address, range:[1,32]-->10.20.30.10
</ipAddress>
## <object>
<!--ro, opt, enum, operation object, subType:string, desc:"network", "keypad", "remoteCtrl" (remote control), "card"-->network
## </object>
## <params>
<!--ro, opt, string, log parameters, desc:parameters (zone No., etc.)-->test
## </params>
## <seq>
<!--ro, opt, string, device serial No., range:[1,32]-->test
## </seq>
<additionInformation>
<!--ro, opt, string, additional information, range:[1,128], desc:additional information of log-->test
</additionInformation>
<panelUser>
<!--ro, opt, string, user name of the operation panel, range:[0,16]-->admin
</panelUser>
<diskNumber>
<!--ro, opt, int, HDD No., range:[0,10000]-->0
</diskNumber>
<alarmInPort>
<!--ro, opt, int, alarm input port, range:[0,1000]-->0
</alarmInPort>
<alarmOutPort>
<!--ro, opt, int, alarm output port, range:[0,10000]-->0
</alarmOutPort>
<remoteHostIPAddress>
<!--ro, opt, string, remote host IP address, range:[1,32]-->10.12.25.23
</remoteHostIPAddress>
<logLevel>
<!--ro, opt, enum, subType:string-->emergency
</logLevel>
<alarmLevel>
<!--ro, opt, enum, subType:string-->high
</alarmLevel>
<moduleName>
<!--ro, opt, string, range:[1,32]-->test
</moduleName>
</logDescriptor>
</searchMatchItem>
</matchList>
</CMSearchResult>
statusCodestatusStringsubStatusCodeerrorCodedescription
4Invalid OperationsearchLogFailed0x4000A063--
Request URL
GET /ISAPI/System/configurationData?secretkey=<secretkey>
## Query Parameter
## 7.1.4 System Maintenance
7.1.4.1 Export device configuration file
Hikvision co MMC
adil@hikvision.co.az

## Parameter
## Name
## Parameter
## Type
## Description
secretkeystring
The verification key, it is provided by the upper-layer. It should be encrypted for
exporting and recorded for importing.
## Request Message
## None
## Response Message
## Binary Data
statusCodestatusStringsubStatusCodeerrorCodedescription
2Device BusyserviceUnavailable0x20000002--
Request URL
POST /ISAPI/System/configurationData?secretkey=<secretkey>&deviceIndex=<deviceIndex>
## Query Parameter
## Parameter
## Name
## Parameter
## Type
## Description
secretkeystring
The verification key, it is provided by the upper-layer. It should be encrypted for
exporting and recorded for importing.
deviceIndexstring--
## Request Message
## None
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
<requestURL>
<!--ro, opt, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
(Invalid XML Content), 7 (Reboot Required)-->0
</statusCode>
<statusString>
<!--ro, req, enum, status description, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
"Invalid XML Content", "Reboot" (reboot device)-->OK
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
## <description>
<!--ro, opt, string, range:[0,1024]-->badXmlFormat
## </description>
<MErrCode>
<!--ro, opt, string-->0x00000000
</MErrCode>
<MErrDevSelfEx>
<!--ro, opt, string-->0x00000000
</MErrDevSelfEx>
</ResponseStatus>
statusCodestatusStringsubStatusCodeerrorCodedescription
6Invalid ContentbadDevType0x60000010--
7.1.4.2 Import device configuration file
## 7.1.5 Time Management
Hikvision co MMC
adil@hikvision.co.az

Request URL
GET /ISAPI/System/time
## Query Parameter
## None
## Request Message
## None
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<Time xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, opt, object, time management, attr:version{opt, string, protocolVersion}-->
<timeMode>
<!--ro, req, enum, time synchronization mode, subType:string, desc:“NTP” (NTP time synchronization), “manual” (manual time synchronization), “satellite”
(satellite time synchronization), “platform” (platform time synchronization), “NONE” (time synchronization is not allowed or no time synchronization
source), “GB28181” (GB28181 time synchronization)-->NTP
</timeMode>
<localTime>
<!--ro, opt, string, local time, range:[0,256], dep:and,{$.Time.timeMode,eq,manual}-->2019-02-28T10:50:44+08:30
</localTime>
<timeZone>
<!--ro, opt, string, time zone, range:[0,256], dep:and,{$.Time.timeMode,eq,manual},{$.Time.timeMode,eq,NTP}, desc:daylight saving time configuration in
time zone-->CST-8:00:00DST00:30:00,M4.1.0/02:00:00,M10.5.0/02:00:00
</timeZone>
<satelliteInterval>
<!--ro, opt, int, satellite time synchronization interval, step:1, unit:min, dep:and,{$.Time.timeMode,eq,satellite}, desc:unit: minute-->60
</satelliteInterval>
<isSummerTime>
<!--ro, opt, bool, whether the device time returned currently is in DST (Daylight Saving Time) system, desc:whether the device time returned currently
is in DST (Daylight Saving Time) system-->true
</isSummerTime>
<platformType>
<!--ro, opt, enum, platform type, subType:string, dep:and,{$.Time.timeMode,eq,platform}, desc:exists only when the timeMode is selected as platform--
## >EZVIZ
</platformType>
<platformNo>
<!--ro, opt, int, platform No., range:[1,2], dep:and,{$.Time.timeMode,eq,GB28181}, desc:it is the only ID, which is configured via platformNo in
GB28181List, related URI: /ISAPI/System/Network/SIP/<SIPServerID>-->1
</platformNo>
<ethernetPort>
<!--ro, opt, int, range:[0,255], dep:and,{$.Time.timeMode,eq,PTP}-->0
</ethernetPort>
## <IANA>
<!--ro, opt, enum, subType:string-->Africa/Abidjan
## </IANA>
<windowsZone>
<!--ro, opt, enum, subType:string-->Dateline Standard Time
</windowsZone>
## <standard>
<!--ro, opt, enum, format, subType:string, desc:"PAL", "NTSC"-->PAL
## </standard>
</Time>
Request URL
PUT /ISAPI/System/time
## Query Parameter
## None
## Request Message
7.1.5.1 Get device time synchronization management parameters
7.1.5.2 Set device time synchronization management parameters
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<Time xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--req, object, time management, attr:version{opt, string, protocolVersion}-->
<timeMode>
<!--req, enum, time synchronization mode, subType:string, desc:“NTP” (NTP time synchronization), “manual” (manual time synchronization), “satellite”
(satellite time synchronization), “platform” (platform time synchronization), “NONE” (time synchronization is not allowed or no time synchronization
source), “GB28181” (GB28181 time synchronization)-->NTP
</timeMode>
<localTime>
<!--opt, string, local time, range:[0,256], dep:and,{$.Time.timeMode,eq,manual}, desc:the time difference between local time and coordinated universal
time (UTC) is configured via the timeZone field-->2019-02-28T10:50:44
</localTime>
<timeZone>
<!--opt, string, time zone, range:[0,256], dep:and,{$.Time.timeMode,eq,manual},{$.Time.timeMode,eq,NTP}, desc:time zone-->CST-
## 8:00:00DST00:30:00,M4.1.0/02:00:00,M10.5.0/02:00:00
</timeZone>
<satelliteInterval>
<!--opt, int, satellite time synchronization interval, step:1, unit:min, dep:and,{$.Time.timeMode,eq,satellite}, desc:unit: minute-->60
</satelliteInterval>
<isSummerTime>
<!--ro, opt, bool, whether the time returned by the current device is that in the DST (daylight saving time), desc:whether the time returned by the
current device is that in the DST (daylight saving time)-->true
</isSummerTime>
<platformType>
<!--opt, enum, platform type, subType:string, dep:and,{$.Time.timeMode,eq,platform}, desc:exists only when the timeMode is selected as platform, related
URI: /ISAPI/System/Network/EZVIZ-->EZVIZ
</platformType>
<platformNo>
<!--opt, int, platform No., range:[1,2], dep:and,{$.Time.timeMode,eq,GB28181}, desc:it is the only ID, which is configured via platformNo in
GB28181List, related URI: /ISAPI/System/Network/SIP/<SIPServerID>-->1
</platformNo>
<ethernetPort>
<!--opt, int, range:[0,255], dep:and,{$.Time.timeMode,eq,PTP}-->0
</ethernetPort>
## <IANA>
<!--opt, enum, subType:string-->Africa/Abidjan
## </IANA>
<windowsZone>
<!--opt, enum, subType:string-->Dateline Standard Time
</windowsZone>
## <standard>
<!--opt, enum, format, subType:string, desc:"PAL", "NTSC"-->PAL
## </standard>
</Time>
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
<requestURL>
<!--ro, opt, string, request URL-->null
</requestURL>
<statusCode>
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
(Invalid XML Content), 7 (Reboot Required)-->0
</statusCode>
<statusString>
<!--ro, req, enum, status description, subType:string, desc:“OK” (succeeded), “Device Busy”, “Device Error”, “Invalid Operation”, “Invalid XML Format”,
“Invalid XML Content”, “Reboot” (reboot device)-->OK
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code-->OK
</subStatusCode>
<FailedNodeInfoList>
<!--ro, opt, object, information list of failed nodes, desc:for the manual time synchronization of central analysis cluster, this field is returned if
time synchronization failed-->
<FailedNodeInfo>
<!--ro, opt, object, information of failed nodes-->
<nodeID>
<!--ro, req, string, node ID, range:[0,64]-->test
</nodeID>
<nodeIP>
<!--ro, req, string, node IP, range:[0,20]-->test
</nodeIP>
## <reason>
<!--ro, opt, string, reason why the node failed to synchronize time, range:[0,128]-->test
## </reason>
</FailedNodeInfo>
</FailedNodeInfoList>
## <description>
<!--ro, opt, string, custom error message description, range:[0,1024], desc:the custom error message description returned by the application is used to
quickly identify and evaluate issues-->badXmlFormat
## </description>
</ResponseStatus>
Hikvision co MMC
adil@hikvision.co.az

statusCodestatusStringsubStatusCode
## 4
## Invalid
## Operation
pleaseSyncToAReasonableTimeOtherwiseDeviceTimeExceptionMayOccurWhichMayCauseVideoLoss
## 4
## Invalid
## Operation
theTimeZoneIsLockedPleaseUnlockItThroughTheLocalGuiInterface
## 4
## Invalid
## Operation
theTimeDoesNotComplyWithTheRules
## 4
## Invalid
## Operation
theCurrentNtpTimingIsValidTimingIsNotAllowed
## 4
## Invalid
## Operation
ntpTimeIsInInvalidStatusProtection
## 6
## Invalid
## Content
verifyingUseTimingError
Request URL
GET /ISAPI/System/time/capabilities
## Query Parameter
## None
## Request Message
## None
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<Time xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, opt, object, time management capability set, attr:version{opt, string, protocolVersion}-->
<timeMode opt="NTP,manual,satellite,SDK,28181,ONVIF,ALL(任何支持的校时方式都允许校时),NONE(不允校时或无校时源),platform,PTP">
<!--ro, req, enum, time synchronization mode, subType:string, attr:opt{opt, string}, desc:“NTP” (NTP time synchronization), “manual” (manual time
synchronization), “satellite” (satellite time synchronization), “platform” (platform time synchronization), “NONE” (time synchronization is not allowed or
no time synchronization source), “GB28181” (GB28181 time synchronization)-->NTP
</timeMode>
<localTime min="0" max="256">
<!--ro, opt, string, local time, range:[0,256], attr:min{opt, string},max{opt, string}-->test
</localTime>
<timeZone min="0" max="256">
<!--ro, opt, string, time zone, range:[0,256], attr:min{opt, string},max{opt, string}-->test
</timeZone>
<satelliteInterval min="0" max="3600">
<!--ro, opt, int, satellite time synchronization interval, step:1, unit:min, attr:min{opt, string},max{opt, string}, desc:unit: minute-->60
</satelliteInterval>
<timeType opt="local,UTC">
<!--ro, opt, enum, time type, subType:string, attr:opt{opt, string}, desc:“local” (local time), “UTC” (UTC time)-->local
</timeType>
<platformType opt="EZVIZ">
<!--ro, opt, enum, platform type, subType:string, dep:and,{$.Time.timeMode,eq,platform}, attr:opt{opt, string}, desc:platform type-->EZVIZ
</platformType>
<platformNo min="1" max="2">
<!--ro, opt, int, platform No., range:[1,2], dep:and,{$.Time.timeMode,eq,GB28181}, attr:min{req, int},max{req, int}, desc:it is the only ID, which is
configured via platformNo in GB28181List, related URI: /ISAPI/System/Network/SIP/<SIPServerID>-->1
</platformNo>
<isSupportHistoryTime>
<!--ro, opt, bool, supported capability of the historical time synchronization list, desc:related URI: /ISAPI/System/time/historyInfo?format=json-->true
</isSupportHistoryTime>
<isSupportTimeFilter>
<!--ro, opt, bool, supported capability of filtering time synchronization, desc:related URI: /ISAPI/System/time/filter/capabilities?format=json-->true
</isSupportTimeFilter>
<displayFormat opt="MM/dd/yyyy hh:mm,mm,dd-MM-yyyy hh,MM-dd-yyyy hh:mm,yyyy-MM-dd hh:mm,MM/dd/yyyy hh:mm:ss,dd-MM-yyyy hh:mm:ss,MM-dd-yyyy hh:mm:ss,yyyy-
MM-dd hh:mm:ss,yyyy-MM-dd,dd-MM-yyyy,MM-dd-yyyy">
<!--ro, opt, enum, time display format, subType:string, attr:opt{req, string}, desc:if this node is returned, it indicates that the device supports
configuring time display format, related URI: /ISAPI/System/time/timeType?format=json-->MM/dd/yyyy hh:mm
</displayFormat>
<isSupportSyncDeviceNTPInfoToCamera>
<!--ro, opt, bool, the capability of synchronizing device’s NTP service information with the camera, desc:related URI:
/ISAPI/System/time/SyncDeviceNTPInfoToCamera/capabilities?format=json-->true
</isSupportSyncDeviceNTPInfoToCamera>
<isSupportNTPService>
7.1.5.3 Get the capability of device time synchronization management
Hikvision co MMC
adil@hikvision.co.az

<isSupportNTPService>
<!--ro, opt, bool-->true
</isSupportNTPService>
<isSupportTimeZoneListInfo>
<!--ro, opt, bool-->true
</isSupportTimeZoneListInfo>
<isSupportAutoEnterSummerTime>
<!--ro, opt, bool-->true
</isSupportAutoEnterSummerTime>
<ethernetPort min="0" max="255">
<!--ro, opt, int, range:[0,255], dep:and,{$.Time.timeMode,eq,PTP}, attr:min{req, int},max{req, int}-->1
</ethernetPort>
## <IANA
opt="Africa/Abidjan,Africa/Accra,Africa/Addis_Ababa,Africa/Algiers,Africa/Blantyre,Africa/Brazzaville,Africa/Cairo,Africa/Casablanca,Africa/Conakry,Africa/D
akar,Africa/Dar_es_Salaam,Africa/Djibouti,Africa/Freetown,Africa/Gaborone,Africa/Harare,Africa/Johannesburg,Africa/Kampala,Africa/Khartoum,Africa/Kigali,Afr
ica/Kinshasa,Africa/Lagos,Africa/Maseru,Africa/Mogadishu,Africa/Nairobi,Africa/Sao_Tome,Africa/Timbuktu,Africa/Tripoli,Africa/Tunis,America/Anchorage,Americ
a/Aruba,America/Asuncion,America/Barbados,America/Belize,America/Bogota,America/Buenos_Aires,America/Cancun,America/Caracas,America/Cayman,America/Chicago,A
merica/Curacao,America/Dawson_Creek,America/Denver,America/Detroit,America/Dominica,America/Edmonton,America/El_Salvador,America/Fortaleza,America/Grand_Tur
k,America/Grenada,America/Guatemala,America/Guyana,America/Halifax,America/Havana,America/Indiana/Indianapolis,America/Indiana/Knox,America/Indiana/Marengo,
America/Indiana/Petersburg,America/Indiana/Tell_City,America/Indiana/Vevay,America/Indiana/Vincennes,America/Indiana/Winamac,America/Jamaica,America/La_Paz,
America/Lima,America/Los_Angeles,America/Louisville,America/Managua,America/Martinique,America/Mendoza,America/Metlakatla,America/Mexico_City,America/Monter
rey,America/Montevideo,America/Montreal,America/Nassau,America/New_York,America/North_Dakota/Beulah,America/North_Dakota/Center,America/North_Dakota/New_Sal
em,America/Panama,America/Phoenix,America/Port_of_Spain,America/Port-au-
Prince,America/Puerto_Rico,America/Santo_Domingo,America/Sao_Paulo,America/St_Johns,America/St_Kitts,America/St_Lucia,America/St_Thomas,America/Tijuana,Amer
ica/Toronto,America/Vancouver,America/Winnipeg,Antarctica/South_Pole,Arctic/Longyearbyen,Asia/Almaty,Asia/Amman,Asia/Anadyr,Asia/Aqtau,Asia/Baghdad,Asia/Bah
rain,Asia/Baku,Asia/Bangkok,Asia/Beirut,Asia/Calcutta,Asia/Damascus,Asia/Dhaka,Asia/Dubai,Asia/Gaza,Asia/Hebron,Asia/Ho_Chi_Minh,Asia/Hong_Kong,Asia/Jakarta
,Asia/Jerusalem,Asia/Kabul,Asia/Karachi,Asia/Kathmandu,Asia/Kuala_Lumpur,Asia/Kuwait,Asia/Macau(China),Asia/Manila,Asia/Muscat,Asia/Phnom_Penh,Asia/Pyongyan
g,Asia/Rangoon,Asia/Riyadh,Asia/Seoul,Asia/Shanghai,Asia/Singapore,Asia/Taipei,Asia/Tehran,Asia/Tel_Aviv,Asia/Tokyo,Asia/Ulaanbaatar,Atlantic/Bermuda,Atlant
ic/Canary,Atlantic/Cape_Verde,Atlantic/Reykjavik,Atlantic/Stanley,Australia/Adelaide,Australia/Brisbane,Australia/Canberra,Australia/Darwin,Australia/Melbou
rne,Australia/NSW,Australia/Perth,Australia/Queensland,Australia/Sydney,Australia/Victoria,Canada/Newfoundland,Canada/Saskatchewan,Chile/EasterIsland,Europe
/Amsterdam,Europe/Andorra,Europe/Athens,Europe/Belfast,Europe/Belgrade,Europe/Berlin,Europe/Bratislava,Europe/Brussels,Europe/Bucharest,Europe/Budapest,Euro
pe/Chisinau,Europe/Copenhagen,Europe/Dublin,Europe/Gibraltar,Europe/Helsinki,Europe/Isle_of_Man,Europe/Istanbul,Europe/Kiev,Europe/Lisbon,Europe/London,Euro
pe/Luxembourg,Europe/Madrid,Europe/Malta,Europe/Minsk,Europe/Monaco,Europe/Moscow,Europe/Oslo,Europe/Paris,Europe/Prague,Europe/Riga,Europe/Rome,Europe/San_
Marino,Europe/Sarajevo,Europe/Simferopol,Europe/Skopje,Europe/Sofia,Europe/Stockholm,Europe/Tallinn,Europe/Vatican,Europe/Vienna,Europe/Vilnius,Europe/Warsa
w,Europe/Zagreb,Europe/Zurich,Indian/Antananarivo,Indian/Maldives,Indian/Mauritius,Pacific/Auckland,Pacific/Fiji,Pacific/Guam,Pacific/Honolulu,Pacific/Kirit
imati,Pacific/Noumea,America/Antigua,MST,Asia/Kolkata,America/Santiago,Africa/Monrovia,Asia/Colombo,America/Chihuahua,America/Tegucigalpa,America/Paramaribo
,Europe/Ljubljana,Asia/Ashgabat,Africa/Asmara,Asia/Brunei,Africa/Bangui,Africa/Banjul,Asia/Bishkek,Africa/Bissau,Africa/Bujumbura,Asia/Dili,Asia/Dushanbe,Pa
cific/Funafuti,Pacific/Guadalcanal,Africa/Juba,America/St_Vincent,Africa/Libreville,Africa/Lome,Africa/Luanda,Africa/Lusaka,Pacific/Majuro,Africa/Malabo,Afr
ica/Maputo,Africa/Mbabane,Indian/Comoro,Africa/Ndjamena,Pacific/Palau,Africa/Niamey,Europe/Nicosia,Africa/Nouakchott,Pacific/Tongatapu,Africa/Ouagadougou,Am
erica/Lower_Princes,Europe/Podgorica,Pacific/Efate,Africa/Porto-
Novo,Asia/Tashkent,Asia/Tbilisi,Asia/Thimphu,Europe/Tirane,Europe/Vaduz,Asia/Vientiane,Africa/Windhoek,Africa/Douala,Pacific/Nauru,Asia/Yerevan,Etc/GMT+12,E
tc/GMT+11,America/Adak,Pacific/Marquesas,Etc/GMT+9,Etc/GMT+8,America/Whitehorse,Pacific/Easter,America/Regina,America/Indianapolis,America/Cuiaba,America/Ar
aguaina,America/Cayenne,America/Godthab,America/Punta_Arenas,America/Miquelon,America/Bahia,Etc/GMT+2,Atlantic/Azores,Etc/UTC,Europe/Kaliningrad,Europe/Astr
akhan,Europe/Samara,Europe/Saratov,Europe/Volgograd,Asia/Yekaterinburg,Asia/Qyzylorda,Asia/Katmandu,Asia/Omsk,Asia/Barnaul,Asia/Hovd,Asia/Krasnoyarsk,Asia/N
ovosibirsk,Asia/Tomsk,Asia/Irkutsk,Australia/Eucla,Asia/Chita,Asia/Yakutsk,Pacific/Port_Moresby,Australia/Hobart,Asia/Vladivostok,Australia/Lord_Howe,Pacifi
c/Bougainville,Asia/Srednekolymsk,Asia/Magadan,Pacific/Norfolk,Asia/Sakhalin,Asia/Kamchatka,Etc/GMT-12,Pacific/Chatham,Etc/GMT-13,Pacific/Apia">
<!--ro, opt, enum, IANA synchronization, subType:string, attr:opt{opt, string}-->Africa/Abidjan
## </IANA>
<isSupportSearchDeviceIANAList>
<!--ro, opt, bool, whether the device supports searching for supported IANA list, desc:POST /ISAPI/System/time/SearchDeviceIANAList?format=json-->true
</isSupportSearchDeviceIANAList>
<windowsZone opt="Dateline Standard Time,UTC-11,Aleutian Standard Time,Hawaiian Standard Time,Marquesas Standard Time,Alaskan Standard Time,UTC-09,Pacific
Standard Time (Mexico),UTC-08,Pacific Standard Time,US Mountain Standard Time,Mountain Standard Time (Mexico),Mountain Standard Time,Yukon Standard
Time,Central America Standard Time,Central Standard Time,Easter Island Standard Time,Central Standard Time (Mexico),Canada Central Standard Time,SA Pacific
Standard Time,Eastern Standard Time (Mexico),Eastern Standard Time,Haiti Standard Time,Cuba Standard Time,US Eastern Standard Time,Turks And Caicos Standard
Time,Paraguay Standard Time,Atlantic Standard Time,Venezuela Standard Time,Central Brazilian Standard Time,SA Western Standard Time,Pacific SA Standard
Time,Newfoundland Standard Time,Tocantins Standard Time,E. South America Standard Time,SA Eastern Standard Time,Argentina Standard Time,Greenland Standard
Time,Montevideo Standard Time,Magallanes Standard Time,Saint Pierre Standard Time,Bahia Standard Time,UTC-02,Azores Standard Time,Cape Verde Standard
Time,UTC,GMT Standard Time,Greenwich Standard Time,Sao Tome Standard Time,Morocco Standard Time,W. Europe Standard Time,Central Europe Standard Time,Romance
Standard Time,Central European Standard Time,W. Central Africa Standard Time,Jordan Standard Time,GTB Standard Time,Middle East Standard Time,Egypt Standard
Time,E. Europe Standard Time,Syria Standard Time,West Bank Standard Time,South Africa Standard Time,FLE Standard Time,Israel Standard Time,South Sudan
Standard Time,Kaliningrad Standard Time,Sudan Standard Time,Libya Standard Time,Namibia Standard Time,Arabic Standard Time,Turkey Standard Time,Arab
Standard Time,Belarus Standard Time,Russian Standard Time,E. Africa Standard Time,Iran Standard Time,Arabian Standard Time,Astrakhan Standard
Time,Azerbaijan Standard Time,Russia Time Zone 3,Mauritius Standard Time,Saratov Standard Time,Georgian Standard Time,Volgograd Standard Time,Caucasus
Standard Time,Afghanistan Standard Time,West Asia Standard Time,Ekaterinburg Standard Time,Pakistan Standard Time,Qyzylorda Standard Time,India Standard
Time,Sri Lanka Standard Time,Nepal Standard Time,Central Asia Standard Time,Bangladesh Standard Time,Omsk Standard Time,Myanmar Standard Time,SE Asia
Standard Time,Altai Standard Time,W. Mongolia Standard Time,North Asia Standard Time,N. Central Asia Standard Time,Tomsk Standard Time,China Standard
Time,North Asia East Standard Time,Singapore Standard Time,W. Australia Standard Time,Taipei Standard Time,Ulaanbaatar Standard Time,Aus Central W. Standard
Time,Transbaikal Standard Time,Tokyo Standard Time,North Korea Standard Time,Korea Standard Time,Yakutsk Standard Time,Cen. Australia Standard Time,AUS
Central Standard Time,E. Australia Standard Time,AUS Eastern Standard Time,West Pacific Standard Time,Tasmania Standard Time,Vladivostok Standard Time,Lord
Howe Standard Time,Bougainville Standard Time,Russia Time Zone 10,Magadan Standard Time,Norfolk Standard Time,Sakhalin Standard Time,Central Pacific
Standard Time,Russia Time Zone 11,New Zealand Standard Time,UTC+12,Fiji Standard Time,Chatham Islands Standard Time,UTC+13,Tonga Standard Time,Samoa
Standard Time,Line Islands Standard Time">
<!--ro, opt, enum, subType:string, attr:opt{opt, string}-->Dateline Standard Time
</windowsZone>
<isSupportTimeStateParam>
<!--ro, opt, bool, desc:GET /ISAPI/System/time/TimeStateParam?format=json-->true
</isSupportTimeStateParam>
<localTimeDST min="0" max="256">
<!--ro, opt, string, range:[0,256], attr:min{opt, string},max{opt, string}-->test
</localTimeDST>
<isSupportStandard>
<!--ro, opt, bool-->true
</isSupportStandard>
<isSupportPTPParams>
<!--ro, opt, bool, desc:GET/PUT /ISAPI/System/time/PTPParams?format=json-->true
</isSupportPTPParams>
<isSupportTimeZoneLock>
<!--ro, opt, bool, desc:GET /ISAPI/System/time/TimeZoneLock?format=json-->true
</isSupportTimeZoneLock>
</Time>
Hikvision co MMC
adil@hikvision.co.az

Request URL
PUT /ISAPI/System/time/localTime
## Query Parameter
## None
## Request Message
## Binary Data
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
<requestURL>
<!--ro, opt, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
(Invalid XML Content), 7 (Reboot Required)-->0
</statusCode>
<statusString>
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
"Invalid XML Content", "Reboot" (reboot device)-->OK
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code description-->OK
</subStatusCode>
## <description>
<!--ro, opt, string, custom error message description, range:[0,1024], desc:the custom error message description returned by the application is used to
quickly identify and evaluate issues-->badXmlFormat
## </description>
<MErrCode>
<!--ro, opt, string, error codes categorized by functional modules, desc:all general error codes are in the range of this field-->0x00000000
</MErrCode>
<MErrDevSelfEx>
<!--ro, opt, string, error codes categorized by functional modules, desc:N/A-->0x00000000
</MErrDevSelfEx>
</ResponseStatus>
Request URL
PUT /ISAPI/System/time/ntpServers
## Query Parameter
## None
## Request Message
7.1.5.4 Set device local time
7.1.5.5 Set parameters of all NTP servers
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<NTPServerList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--req, array, NTP server information list, subType:object, attr:version{opt, string, protocolVersion}-->
<NTPServer>
<!--opt, object, NTP server information-->
## <id>
<!--req, string, ID-->1
## </id>
<addressingFormatType>
<!--req, enum, NTP server address type, subType:string, desc:"ipaddress" (IP address), "hostname" (domain name)-->hostname
</addressingFormatType>
<hostName>
<!--opt, string, NTP server domain name, range:[1,64]-->12345
</hostName>
<ipAddress>
<!--opt, string, IPv4 address, range:[1,32]-->192.168.1.112
</ipAddress>
<ipv6Address>
<!--opt, string, IPv6 address, range:[1,128]-->1030:C9B4:FF12:48AA:1A2B
</ipv6Address>
<portNo>
<!--opt, int, port No., range:[1,65535], desc:the default port No. is 123-->123
</portNo>
<synchronizeInterval>
<!--opt, int, time synchronization interval, range:[1,10800], unit:min-->1440
</synchronizeInterval>
## <enabled>
<!--opt, bool, whether to enable, desc:disabled (by default)-->false
## </enabled>
</NTPServer>
</NTPServerList>
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
<requestURL>
<!--ro, req, string, request URL-->/ISAPI/xxxx
</requestURL>
<statusCode>
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
(Invalid XML Content), 7 (Reboot Required)-->0
</statusCode>
<statusString>
<!--ro, req, enum, status description, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
"Invalid XML Content", "Reboot" (reboot device)-->OK
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/System/time/ntpServers
## Query Parameter
## None
## Request Message
## None
## Response Message
7.1.5.6 Get the parameters of a specific NTP (Network Time Protocol) server
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<NTPServerList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, array, NTP server information list, subType:object, attr:version{req, string, protocolVersion}-->
<NTPServer>
<!--ro, opt, object, NTP server information-->
## <id>
<!--ro, req, string, ID-->1
## </id>
<addressingFormatType>
<!--ro, req, enum, NTP server address type, subType:string, desc:"ipaddress" (IP address), "hostname" (domain name)-->hostname
</addressingFormatType>
<hostName>
<!--ro, opt, string, NTP server domain name, range:[1,64]-->12345
</hostName>
<ipAddress>
<!--ro, opt, string, IPv4 address, range:[1,32]-->192.168.1.112
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address, range:[1,128]-->1030:C9B4:FF12:48AA:1A2B
</ipv6Address>
<portNo>
<!--ro, opt, int, port No., range:[1,65535], desc:the default port No. is 123-->123
</portNo>
<synchronizeInterval>
<!--ro, opt, int, time synchronization interval, range:[1,10800], unit:min-->1440
</synchronizeInterval>
## <enabled>
<!--ro, opt, bool, whether to enable, desc:disabled (by default)-->false
## </enabled>
</NTPServer>
</NTPServerList>
Request URL
PUT /ISAPI/System/time/ntpServers/<NTPServerID>
## Query Parameter
Parameter NameParameter TypeDescription
NTPServerIDstring--
## Request Message
<?xml version="1.0" encoding="UTF-8"?>
<NTPServer xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--req, object, NTP server information, attr:version{req, string, protocolVersion}-->
## <id>
<!--req, string, ID-->1
## </id>
<addressingFormatType>
<!--req, enum, IP address type of NTP server, subType:string, desc:"ipaddress" (IP address), "hostname" (domain name)-->hostname
</addressingFormatType>
<hostName>
<!--opt, string, NTP server domain name地址去掉, range:[1,64]-->12345
</hostName>
<ipAddress>
<!--opt, string, IPv4 address, range:[1,32], desc:IPv4 address-->192.168.1.112
</ipAddress>
<ipv6Address>
<!--opt, string, IPv6 address, range:[1,128], desc:IPv6 address-->1030:C9B4:FF12:48AA:1A2B
</ipv6Address>
<portNo>
<!--opt, int, port No., range:[1,65535], step:1, desc:port No.-->1
</portNo>
<synchronizeInterval>
<!--opt, int, time synchronization interval, range:[1,10800], step:1, unit:min, desc:NTP time synchronization interval, unit: minute-->1440
</synchronizeInterval>
## <enabled>
<!--opt, bool-->false
## </enabled>
</NTPServer>
## Response Message
7.1.5.7 Set the parameters of a NTP server
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
(Invalid XML Content), 7 (Reboot Required)-->0
</statusCode>
<statusString>
<!--ro, req, enum, status description, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
"Invalid XML Content", "Reboot" (reboot device)-->OK
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/System/time/ntpServers/<NTPServerID>
## Query Parameter
Parameter NameParameter TypeDescription
NTPServerIDstringNTP server No.
## Request Message
## None
## Response Message
7.1.5.8 Get the parameters of a NTP server
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<NTPServer xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, NTP server information, attr:version{req, string, protocolVersion}-->
## <id>
<!--ro, req, string, ID-->1
## </id>
<addressingFormatType>
<!--ro, req, enum, IP address type of NTP server, subType:string, desc:"ipaddress" (IP address), "hostname" (domain name)-->hostname
</addressingFormatType>
<hostName>
<!--ro, opt, string, NTP server domain name, range:[1,64], dep:and,{$.NTPServer.addressingFormatType,eq,hostname}-->xxx12345
</hostName>
<ipAddress>
<!--ro, opt, string, IPv4 address, range:[1,32], dep:and,{$.NTPServer.addressingFormatType,eq,ipAddress}-->192.168.1.112
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address, range:[1,128]-->1030:C9B4:FF12:48AA:1A2B
</ipv6Address>
<portNo>
<!--ro, opt, int, port No., range:[1,65535], step:1, desc:port No.-->1
</portNo>
<synchronizeInterval>
<!--ro, opt, int, time synchronization interval, range:[1,10800], step:1, unit:min, desc:NTP time synchronization interval, unit: minute-->1440
</synchronizeInterval>
## <enabled>
<!--ro, opt, bool-->false
## </enabled>
<devicePortNoValid>
<!--ro, opt, enum, subType:string-->yes
</devicePortNoValid>
<portType>
<!--ro, opt, enum, subType:string-->auto
</portType>
<customPortNo>
<!--ro, opt, int, range:[1,65535], step:1, dep:and,{$.NTPServer.portType,eq,custom}-->1
</customPortNo>
<hostNameExampleList>
<!--ro, opt, array, subType:object-->
<hostNameExample>
<!--ro, opt, object-->
<hostName>
<!--ro, opt, string-->xxx12345
</hostName>
</hostNameExample>
</hostNameExampleList>
</NTPServer>
Request URL
GET /ISAPI/System/time/ntpServers/<NTPServerID>/capabilities
## Query Parameter
Parameter NameParameter TypeDescription
NTPServerIDstring--
## Request Message
## None
## Response Message
7.1.5.9 Get the configuration capability of a specific NTP server
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<NTPServer xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, NTP server information, attr:version{req, string, protocolVersion}-->
<id min="1" max="1">
<!--ro, req, string, ID, range:[0,1], attr:min{req, int},max{req, int}-->1
## </id>
<addressingFormatType opt="ipaddress,hostname">
<!--ro, req, enum, IP address type of NTP server, subType:string, attr:opt{req, string}, desc:"ipaddress" (IP address), "hostname" (domain name)--
## >hostname
</addressingFormatType>
<hostName min="0" max="68">
<!--ro, opt, string, NTP server domain name, range:[0,68], attr:min{req, int},max{req, int}-->time.windows.com
</hostName>
<ipAddress min="0" max="32">
<!--ro, opt, string, IPv4 address, range:[0,32], attr:min{req, int},max{req, int}, desc:IPv4 address-->192.168.1.112
</ipAddress>
<ipv6Address min="0" max="128">
<!--ro, opt, string, IPv6 address, range:[0,128], attr:min{req, int},max{req, int}, desc:IPv6 address-->1030::C9B4:FF12:48AA:1A2B
</ipv6Address>
<portNo min="0" max="65535">
<!--ro, opt, int, port No., range:[0,65535], attr:min{req, int},max{req, int}, desc:port No.-->123
</portNo>
<synchronizeInterval min="0" max="10800">
<!--ro, opt, int, time synchronization interval, range:[0,10800], unit:min, attr:min{req, int},max{req, int}, desc:NTP time synchronization interval,
unit: minute-->1440
</synchronizeInterval>
<enabled opt="true,false">
<!--ro, opt, bool, attr:opt{req, string}-->true
## </enabled>
<portType opt="auto,custom" def="auto">
<!--ro, opt, enum, subType:string, attr:opt{req, string},def{req, string}-->auto
</portType>
<customPortNo min="1" max="65535">
<!--ro, opt, int, range:[0,65535], dep:and,{$.NTPServer.portType,eq,custom}, attr:min{req, int},max{req, int}-->123
</customPortNo>
</NTPServer>
Request URL
GET /ISAPI/System/time/ntpServers/capabilities
## Query Parameter
## None
## Request Message
## None
## Response Message
7.1.5.10 Get the configuration capability of parameters of a specific NTP (Network Time Protocol) server
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<NTPServerList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, array, NTP server information list, subType:object, attr:version{opt, string, protocolVersion}-->
<NTPServer>
<!--ro, opt, object, NTP server information-->
## <id>
<!--ro, req, string, ID-->1
## </id>
<addressingFormatType opt="ipaddress,hostname">
<!--ro, req, enum, NTP server address type, subType:string, attr:opt{req, string}, desc:"ipaddress" (IP address), "hostname" (domain name)-->hostname
</addressingFormatType>
<hostName min="1" max="64">
<!--ro, opt, string, NTP server domain name, range:[1,64], attr:min{req, int},max{req, int}-->12345
</hostName>
<ipAddress min="1" max="32">
<!--ro, opt, string, IPv4 address, range:[1,32], attr:min{req, int},max{req, int}, desc:IPv4 address-->192.168.1.112
</ipAddress>
<ipv6Address min="1" max="128">
<!--ro, opt, string, IPv6 address, range:[1,128], attr:min{req, int},max{req, int}, desc:IPv6 address-->1030:C9B4:FF12:48AA:1A2B
</ipv6Address>
<portNo min="1" max="65535">
<!--ro, opt, int, port No., range:[1,65535], attr:min{req, int},max{req, int}, desc:the default port No. is 123-->123
</portNo>
<synchronizeInterval min="1" max="10800">
<!--ro, opt, int, time synchronization interval, unit:min, attr:min{req, int},max{req, int}-->1440
</synchronizeInterval>
<enabled opt="true,false">
<!--ro, opt, bool, whether to enable, attr:opt{req, string}, desc:true (enable), false (disable)-->true
## </enabled>
</NTPServer>
</NTPServerList>
Request URL
GET /ISAPI/System/time/timeZone
## Query Parameter
## None
## Request Message
## None
## Response Message
## None
Request URL
PUT /ISAPI/System/time/timeZone
## Query Parameter
## None
## Request Message
## None
## Response Message
7.1.5.11 Get time zone
7.1.5.12 Set time zone
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
(Invalid XML Content), 7 (Reboot Required)-->0
</statusCode>
<statusString>
<!--ro, req, enum, status description, subType:string, desc:“OK” (succeeded), “Device Busy”, “Device Error”, “Invalid Operation”, “Invalid XML Format”,
“Invalid XML Content”, “Reboot” (reboot device)-->OK
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/Security/userCheck
## Query Parameter
## None
## Request Message
## None
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<userCheck xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, attr:version{req, string, protocolVersion}-->
<statusValue>
<!--ro, req, enum, status code, subType:int, desc:"200"(succeeded), "401"(failed)-->200
</statusValue>
<statusString>
<!--ro, opt, enum, status, subType:string, desc:"OK", "Unauthorized"-->OK
</statusString>
<isDefaultPassword>
<!--ro, opt, bool-->true
</isDefaultPassword>
<isRiskPassword>
<!--ro, opt, bool-->true
</isRiskPassword>
<isActivated>
<!--ro, opt, bool-->true
</isActivated>
<residualValidity>
<!--ro, opt, int-->1
</residualValidity>
<lockStatus>
<!--ro, opt, enum, locking status, subType:string, desc:"unlock", "locked"-->unlock
</lockStatus>
<unlockTime>
<!--ro, opt, int, unlocking remaining time, unit:s-->1
</unlockTime>
<retryLoginTime>
<!--ro, opt, int, remaining login attempts-->1
</retryLoginTime>
</userCheck>
## 7.1.6 User Management
7.1.6.1 Log in to the device by digest
Hikvision co MMC
adil@hikvision.co.az

statusCodestatusStringsubStatusCodeerrorCodedescription
1OKneedServicePlatformAccountAuthenticationAndAuthroization0x10000010--
## 4
## Invalid
## Operation
deviceIsLocked0x4000A3E9--
## 6
## Invalid
## Content
forbiddenIP0x60000070--
Request URL
GET /ISAPI/System/Network/interfaces
## Query Parameter
## None
## Request Message
## None
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<NetworkInterfaceList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, array, IP address parameter list, subType:object, attr:version{req, string, protocolVersion}-->
<NetworkInterface>
<!--ro, req, object, IP address parameters-->
## <id>
<!--ro, req, string, NIC index-->test
## </id>
<IPAddress>
<!--ro, req, object, IP address parameters-->
<ipVersion>
<!--ro, req, enum, IP address version, subType:string, desc:"v4" (IPv4), "v6" (IPv6), "dual" (IPv4 and IPv6)-->v4
</ipVersion>
<addressingType>
<!--ro, req, enum, address type, subType:string, desc:"static", "dynamic", "apipa" (automatic private IP addressing)-->static
</addressingType>
<ipAddress>
<!--ro, opt, string, IPV4 address-->test
</ipAddress>
<subnetMask>
<!--ro, opt, string, IPv4 subnet mask-->test
</subnetMask>
<ipv6Address>
<!--ro, opt, string, IPv6 address-->test
</ipv6Address>
<bitMask>
<!--ro, opt, string, IPv6 subnet mask-->test
</bitMask>
<DefaultGateway>
<!--ro, opt, object, default gateway-->
<ipAddress>
<!--ro, opt, string, IPV4 address-->test
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address-->test
</ipv6Address>
</DefaultGateway>
<PrimaryDNS>
<!--ro, opt, object, preferred DNS-->
<ipAddress>
<!--ro, opt, string, IPV4 address-->test
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address-->test
</ipv6Address>
</PrimaryDNS>
<SecondaryDNS>
<!--ro, opt, object, alternate DNS-->
<ipAddress>
<!--ro, opt, string, IPV4 address-->test
</ipAddress>
## 7.2 Network Configuration
7.2.1 IP Address Management
7.2.1.1 Get parameters of all network interfaces
Hikvision co MMC
adil@hikvision.co.az

</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address-->test
</ipv6Address>
</SecondaryDNS>
<DNSEnable>
<!--ro, opt, bool, DNS automatic allocation-->true
</DNSEnable>
<Ipv6Mode>
<!--ro, opt, object, IPv6 mode-->
<ipV6AddressingType>
<!--ro, opt, enum, IPv6 address type, subType:string, desc:"ra" (router advertisement), "manual" (manual assignment), "dhcp" (DHCP server
assignment)-->ra
</ipV6AddressingType>
<ipv6AddressList>
<!--ro, opt, array, IPv6 address list, subType:object-->
<v6Address>
<!--ro, opt, object, IPV6 Address-->
## <id>
<!--ro, opt, string, IPv6 address index-->test
## </id>
## <type>
<!--ro, opt, enum, IPv6 address type, subType:string, desc:"ra" (router advertisement), "manual" (manual assignment), "dhcp" (DHCP server
assignment)-->ra
## </type>
## <address>
<!--ro, opt, string, IPV6 Address-->test
## </address>
<bitMask>
<!--ro, opt, string, IPv6 subnet mask-->test
</bitMask>
</v6Address>
</ipv6AddressList>
</Ipv6Mode>
<DoubleNetRoute>
<!--ro, opt, object, dual WAN router-->
<ipAddress>
<!--ro, opt, string, IP address-->test
</ipAddress>
<subnetMask>
<!--ro, opt, string, subnet mask-->test
</subnetMask>
</DoubleNetRoute>
<LANConfigMode>
<!--ro, opt, enum, subType:string-->manual
</LANConfigMode>
<DoubleNetRouteList>
<!--ro, opt, array, subType:object, desc:in dual network isolation mode, up to four router configurations are supported; the address of the first
router needs to be configured via DoubleNetRoute, and the additional expansion routes can be configured through this node-->
<DoubleNetRoute>
<!--ro, opt, object, dual WAN router-->
<ipAddress>
<!--ro, opt, string, IP address-->test
</ipAddress>
<subnetMask>
<!--ro, opt, string, subnet mask-->test
</subnetMask>
</DoubleNetRoute>
</DoubleNetRouteList>
<ipv6Enabled>
<!--ro, opt, bool-->true
</ipv6Enabled>
</IPAddress>
<Wireless>
<!--ro, opt, object-->
## <enabled>
<!--ro, req, bool-->true
## </enabled>
<wirelessNetworkMode>
<!--ro, opt, enum, subType:string-->infrastructure
</wirelessNetworkMode>
## <channel>
<!--ro, opt, string-->test
## </channel>
## <ssid>
<!--ro, opt, string, SSID (Service Set Identifier)-->test
## </ssid>
<wmmEnabled>
<!--ro, opt, bool, enable WMM (Wi-Fi multimedia)-->true
</wmmEnabled>
<WirelessSecurity>
<!--ro, opt, object, wireless network security-->
<securityMode>
<!--ro, opt, enum, security mode, subType:string-->disable
</securityMode>
## <WEP>
<!--ro, opt, object, dep:or,{$.NetworkInterface.Wireless.WirelessSecurity.securityMode,eq,WEP}-->
<authenticationType>
<!--ro, req, enum, the authentication type, subType:string-->open
</authenticationType>
<defaultTransmitKeyIndex>
<!--ro, req, int, default number of transmitted keys-->1
</defaultTransmitKeyIndex>
<wepKeyLength>
Hikvision co MMC
adil@hikvision.co.az

<wepKeyLength>
<!--ro, opt, int, key length, range:[64,128]-->1
</wepKeyLength>
<EncryptionKeyList>
<!--ro, opt, array, subType:object-->
<encryptionKey>
<!--ro, req, string, Secret key-->test
</encryptionKey>
</EncryptionKeyList>
## </WEP>
## <WPA>
<!--ro, opt, object, WPA-personal, dep:or,{$.NetworkInterface.Wireless.WirelessSecurity.securityMode,eq,WPA}-->
<algorithmType>
<!--ro, req, enum, algorithm type, subType:string-->TKIP
</algorithmType>
<sharedKey>
<!--ro, req, string, shared key authentication-->test
</sharedKey>
<wpaKeyLength>
<!--ro, req, int, key length, range:[8,63]-->1
</wpaKeyLength>
## </WPA>
</WirelessSecurity>
<workScene>
<!--ro, opt, enum, subType:string-->computerRoom
</workScene>
## <protocol>
<!--ro, opt, enum, protocol type, subType:string-->802.11ac
## </protocol>
<protocolRealTime>
<!--ro, opt, string, real-time mode-->test
</protocolRealTime>
<hideSsid>
<!--ro, opt, bool, hidden SSID-->true
</hideSsid>
<ChannelConfig>
<!--ro, opt, object, channel configuration-->
## <width>
<!--ro, opt, enum, bandwidth, subType:string-->auto
## </width>
<autoWidth>
<!--ro, opt, string, bandwidth-->test
</autoWidth>
## <channel>
<!--ro, opt, string, channel-->test
## </channel>
<autoChannel>
<!--ro, opt, string, automatic channel-->test
</autoChannel>
<transmitPower>
<!--ro, opt, enum, power load, subType:int-->9
</transmitPower>
<transmitPowerRealTime>
<!--ro, opt, int, real-time power-->1
</transmitPowerRealTime>
<countryID>
<!--ro, opt, int, country code-->1
</countryID>
</ChannelConfig>
## <rate>
<!--ro, opt, enum, frequency, subType:string-->2.4GHz
## </rate>
<dialUpGroupNo>
<!--ro, opt, string, SSID dial group No.-->test
</dialUpGroupNo>
<baseNoisevalue>
<!--ro, opt, int, background noise value, step:1-->1
</baseNoisevalue>
</Wireless>
<Discovery>
<!--ro, opt, object, the network discovery configuration-->
<UPnP>
<!--ro, req, object, UPnP-->
## <enabled>
<!--ro, req, bool, whether to enable UPnP-->true
## </enabled>
</UPnP>
<Zeroconf>
<!--ro, opt, object-->
## <enabled>
<!--ro, req, bool-->true
## </enabled>
</Zeroconf>
</Discovery>
<Link>
<!--ro, opt, object, NIC connection information-->
<MACAddress>
<!--ro, req, string, MAC address-->test
</MACAddress>
<autoNegotiation>
<!--ro, req, bool, whether to enable the auto-negotiation-->true
</autoNegotiation>
## <speed>
<!--ro, req, enum, link speed, subType:int-->10
## </speed>
Hikvision co MMC
adil@hikvision.co.az

## </speed>
## <duplex>
<!--ro, req, enum, duplex mode, subType:string-->half
## </duplex>
## <MTU>
<!--ro, req, int, MTU-->1
## </MTU>
<linkMode>
<!--ro, opt, enum, connection mode, subType:string, desc:"optical", "electrical"-->optical
</linkMode>
</Link>
<defaultConnection>
<!--ro, opt, bool-->true
</defaultConnection>
<ActiveMulticast>
<!--ro, opt, object, active multicast-->
## <enabled>
<!--ro, req, bool, whether to enable-->true
## </enabled>
<streamID>
<!--ro, req, enum, stream type, subType:string-->main
</streamID>
<ipV4Address>
<!--ro, opt, string, IPV4 address-->test
</ipV4Address>
<ipV6Address>
<!--ro, opt, string, IPv6 address-->test
</ipV6Address>
## <port>
<!--ro, opt, int, port No.-->1
## </port>
</ActiveMulticast>
<macAddress>
<!--ro, opt, string, MAC address-->test
</macAddress>
<EthernetPortList>
<!--ro, opt, array, subType:object-->
<EthernetPort>
<!--ro, opt, object-->
## <id>
<!--ro, req, int, port ID, range:[1,4]-->1
## </id>
<MACAddress>
<!--ro, req, string, MAC address-->test
</MACAddress>
## <status>
<!--ro, opt, enum, connection status, subType:string-->connected
## </status>
## <speed>
<!--ro, req, enum, speed, subType:string-->10
## </speed>
</EthernetPort>
</EthernetPortList>
<Extensions>
<!--ro, opt, object, extension information-->
<NetworkCardType>
<!--ro, opt, enum, NIC type, subType:string-->normal
</NetworkCardType>
</Extensions>
<interfaceName>
<!--ro, opt, string, NIC name-->test
</interfaceName>
## <enabled>
<!--ro, opt, bool-->true
## </enabled>
<softStorageinterfaceEnabled>
<!--ro, opt, bool-->true
</softStorageinterfaceEnabled>
<dualControlNICList>
<!--ro, opt, array, subType:object, range:[1,2]-->
<dualControlNIC>
<!--ro, opt, object-->
## <role>
<!--ro, req, enum, subType:string-->controllerA
## </role>
<ipV4Address>
<!--ro, opt, string-->10.255.255.0
</ipV4Address>
</dualControlNIC>
</dualControlNICList>
</NetworkInterface>
</NetworkInterfaceList>
Request URL
GET /ISAPI/System/Network/interfaces/<interfaceID>/capabilities
## Query Parameter
7.2.1.2 Get capability of a specific network interface
Hikvision co MMC
adil@hikvision.co.az

Parameter NameParameter TypeDescription
interfaceIDstringNIC ID
## Request Message
## None
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<NetworkInterface xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, network, attr:version{req, string, protocolVersion}-->
## <id>
<!--ro, req, string, ID-->1
## </id>
<IPAddress>
<!--ro, req, object, IP address-->
<ipVersion opt="v4,v6,dual">
<!--ro, req, enum, IP address version, subType:string, attr:opt{req, string}, desc:"v4" (IPv4), "v6" (IPv6), "dual" (IPv4 and IPv6)-->v4
</ipVersion>
<addressingType opt="static,dynamic,apipa">
<!--ro, req, enum, address type, subType:string, attr:opt{req, string}, desc:"static", "dynamic", "apipa" (automatic private IP addressing)-->static
</addressingType>
<ipAddress>
<!--ro, opt, string, IP address-->test
</ipAddress>
<subnetMask>
<!--ro, opt, string, sub-net mask-->test
</subnetMask>
<ipv6Address>
<!--ro, opt, string, IPv6 address-->test
</ipv6Address>
<bitMask>
<!--ro, opt, string, bitmask-->test
</bitMask>
<DefaultGateway>
<!--ro, opt, object, default gateway-->
<ipAddress>
<!--ro, opt, string, IP address-->test
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address-->test
</ipv6Address>
</DefaultGateway>
<PrimaryDNS>
<!--ro, opt, object-->
<ipAddress>
<!--ro, opt, string, IP address-->test
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address-->test
</ipv6Address>
</PrimaryDNS>
<SecondaryDNS>
<!--ro, opt, object, secondary DNS-->
<ipAddress>
<!--ro, opt, string, IP address-->test
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address-->test
</ipv6Address>
</SecondaryDNS>
<DNSEnable opt="true,false">
<!--ro, opt, bool, whether to enable automatic DNS assignment, attr:opt{req, string}-->true
</DNSEnable>
<Ipv6Mode>
<!--ro, opt, object, IPv6 mode-->
<ipV6AddressingType opt="ra,manual,dhcp">
<!--ro, opt, enum, IPv6 address type, subType:string, attr:opt{req, string}, desc:"ra" (router advertisement), "manual" (manual assignment), "dhcp"
(DHCP server assignment)-->ra
</ipV6AddressingType>
<ipv6AddressList>
<!--ro, opt, array, IPv6 address list, subType:object-->
<v6Address>
<!--ro, opt, object, IPv6 address-->
<id min="1" max="10">
<!--ro, opt, string, ID, attr:min{req, int},max{req, int}-->test
## </id>
<type opt="ra,manual,dhcp">
<!--ro, opt, string, type, attr:opt{req, string}-->test
## </type>
<address min="1" max="10">
<!--ro, opt, string, address, attr:min{req, int},max{req, int}-->test
## </address>
<bitMask min="1" max="10">
<!--ro, opt, int, bitmask, attr:min{req, int},max{req, int}-->1
</bitMask>
</v6Address>
Hikvision co MMC
adil@hikvision.co.az

</v6Address>
</ipv6AddressList>
</Ipv6Mode>
<DoubleNetRoute>
<!--ro, opt, object, dual WAN router-->
<ipAddress min="1" max="10">
<!--ro, opt, string, IP address, attr:min{req, int},max{req, int}-->test
</ipAddress>
<subnetMask min="1" max="10">
<!--ro, opt, string, subnet mask, attr:min{req, int},max{req, int}-->test
</subnetMask>
</DoubleNetRoute>
<LANConfigMode opt="manual,auto">
<!--ro, opt, string, attr:opt{req, string}-->test
</LANConfigMode>
<DoubleNetRouteList size="3">
<!--ro, opt, object, attr:size{req, int}, desc:in dual network isolation mode, up to four router configurations are supported; the address of the
first router needs to be configured via DoubleNetRoute, and the additional expansion routes can be configured through this node-->
<DoubleNetRoute>
<!--ro, opt, object, dual WAN router-->
<ipAddress min="1" max="10">
<!--ro, opt, string, IP address, attr:min{req, int},max{req, int}-->test
</ipAddress>
<subnetMask min="1" max="10">
<!--ro, opt, string, subnet mask, attr:min{req, int},max{req, int}-->test
</subnetMask>
</DoubleNetRoute>
</DoubleNetRouteList>
<ipv6Enabled opt="true,false">
<!--ro, opt, bool, attr:opt{req, string}-->true
</ipv6Enabled>
</IPAddress>
<Wireless>
<!--ro, opt, object-->
## <enabled>
<!--ro, req, bool, whether to enable-->true
## </enabled>
<wirelessNetworkMode opt="infrastructure,adhoc">
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->infrastructure
</wirelessNetworkMode>
<channel opt="1,2,3,4,5,6,7,8,9,10,11,12,13,14,auto">
<!--ro, opt, enum, channel 1, subType:string, attr:opt{req, string}-->auto
## </channel>
<ssid min="1" max="10">
<!--ro, opt, string, SSID, attr:min{req, int},max{req, int}-->test
## </ssid>
<wmmEnabled>
<!--ro, opt, bool-->true
</wmmEnabled>
<WirelessSecurity>
<!--ro, opt, object, wireless network security-->
<securityMode opt="disable,WEP,WPA-personal,WPA2-personal,WPA-RADIUS,WPA-enterprise,WPA2-enterprise,WPA3">
<!--ro, opt, enum, security mode, subType:string, attr:opt{req, string}-->disable
</securityMode>
## <WEP>
<!--ro, opt, object, WEP-->
<authenticationType opt="open,sharedkey,auto">
<!--ro, req, enum, Identity Authentication Type, subType:string, attr:opt{req, string}-->open
</authenticationType>
<defaultTransmitKeyIndex min="1" max="10">
<!--ro, req, int, attr:min{req, int},max{req, int}-->1
</defaultTransmitKeyIndex>
<wepKeyLength opt="64,128">
<!--ro, opt, enum, subType:int, attr:opt{req, string}-->64
</wepKeyLength>
<EncryptionKeyList>
<!--ro, opt, array, subType:object-->
<encryptionKey>
<!--ro, opt, string, encryption key-->test
</encryptionKey>
</EncryptionKeyList>
## </WEP>
## <WPA>
<!--ro, opt, object, WPA-->
<algorithmType opt="TKIP,AES,TKIP/AES">
<!--ro, req, enum, algorithm type, subType:string, attr:opt{req, string}, desc:algorithm type-->TKIP
</algorithmType>
<sharedKey>
<!--ro, req, string-->test
</sharedKey>
<wpaKeyLength min="8" max="64">
<!--ro, req, int, range:[8,64], attr:min{req, int},max{req, int}-->8
</wpaKeyLength>
## </WPA>
<support64bitKey opt="WPA-personal,WPA2-personal">
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->WPA-personal
</support64bitKey>
</WirelessSecurity>
<AccessPointList>
<!--ro, opt, array, subType:object-->
<InterfaceDisplay>
<!--ro, opt, object-->
<TableElementList>
<!--ro, opt, array, subType:object-->
Hikvision co MMC
adil@hikvision.co.az

<!--ro, opt, array, subType:object-->
<TableElement opt="SSID,workingMode,securityMode,channel,signalStrength,speed,connectionStatus">
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->securityMode
</TableElement>
</TableElementList>
</InterfaceDisplay>
</AccessPointList>
<isSupportConnectStatus>
<!--ro, opt, bool-->true
</isSupportConnectStatus>
<workScene opt="computerRoom,monitorTerminal,centralTerminal">
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->computerRoom
</workScene>
<protocol opt="802.11ac">
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->802.11ac
## </protocol>
<hideSsid>
<!--ro, opt, bool-->true
</hideSsid>
<ChannelConfig>
<!--ro, opt, object, channel parameters-->
<transmitPower opt="9,12,15,18,21,24,27">
<!--ro, opt, enum, power load, subType:int, attr:opt{req, string}-->9
</transmitPower>
<ChannelCountryList>
<!--ro, opt, array, subType:object-->
<Country>
<!--ro, opt, object, country-->
<countryID>
<!--ro, req, int, country code-->1
</countryID>
<ChannelList>
<!--ro, opt, object, channel list-->
<Node>
<!--ro, opt, object, ID-->
<width opt="auto,20,40,80">
<!--ro, req, enum, bandwidth, subType:string, attr:opt{req, string}-->auto
## </width>
## <channel>
<!--ro, req, int, channel 1-->1
## </channel>
</Node>
</ChannelList>
</Country>
</ChannelCountryList>
</ChannelConfig>
<rate opt="2.4GHz,5GHz,auto">
<!--ro, opt, enum, frequency, subType:string, attr:opt{req, string}-->auto
## </rate>
<dialUpGroupNo min="1" max="10">
<!--ro, opt, string, attr:min{req, int},max{req, int}-->test
</dialUpGroupNo>
<BaseNoisevalue min="1" max="10">
<!--ro, opt, int, background noise value, attr:min{req, int},max{req, int}-->1
</BaseNoisevalue>
</Wireless>
<Discovery>
<!--ro, opt, object, explore-->
<UPnP>
<!--ro, req, object, UPnP-->
<enabled opt="true,false">
<!--ro, req, bool, whether to enable, attr:opt{req, string}-->true
## </enabled>
</UPnP>
<Zeroconf>
<!--ro, opt, object-->
<enabled opt="true,false">
<!--ro, req, bool, whether to enable, attr:opt{req, string}-->true
## </enabled>
</Zeroconf>
</Discovery>
<Link>
<!--ro, opt, object, connected-->
<MACAddress>
<!--ro, req, string, MAC address-->test
</MACAddress>
<autoNegotiation opt="true,false">
<!--ro, req, bool, attr:opt{req, string}-->true
</autoNegotiation>
<speed opt="0,10,100,1000,2500">
<!--ro, req, int, "10,100,1000,10000", attr:opt{req, string}, desc:"10,100,1000,10000"-->1
## </speed>
<duplex opt="half,full">
<!--ro, req, enum, subType:string, attr:opt{req, string}-->half
## </duplex>
<MTU min="1" max="1500">
<!--ro, req, int, maximum transmission unit, attr:min{req, int},max{req, int}-->1
## </MTU>
<linkMode opt="optical,electrical">
<!--ro, opt, enum, connection mode, subType:string, attr:opt{req, string}, desc:"optical", "electrical"-->optical
</linkMode>
<workMode opt="1,2,3">
<!--ro, opt, int, operating mode, attr:opt{req, string}-->1
</workMode>
</Link>
Hikvision co MMC
adil@hikvision.co.az

</Link>
<defaultConnection opt="true,false">
<!--ro, opt, bool, attr:opt{req, string}-->true
</defaultConnection>
<ActiveMulticast>
<!--ro, opt, object-->
<enabled opt="true,false">
<!--ro, req, bool, whether to enable, attr:opt{req, string}-->true
## </enabled>
<streamID opt="main">
<!--ro, req, string, stream ID, attr:opt{req, string}-->test
</streamID>
<ipV4Address min="1" max="10">
<!--ro, opt, string, IPv4 address, attr:min{req, int},max{req, int}-->test
</ipV4Address>
<ipV6Address min="1" max="10">
<!--ro, opt, string, IPv6 address, attr:min{req, int},max{req, int}-->test
</ipV6Address>
<port min="1" max="10">
<!--ro, opt, int, port No., attr:min{req, int},max{req, int}-->1
## </port>
</ActiveMulticast>
<macAddress min="1" max="10">
<!--ro, opt, string, MAC address, attr:min{req, int},max{req, int}-->test
</macAddress>
<EthernetPortList size="4">
<!--ro, opt, array, network interface information, subType:object, attr:size{req, int}-->
<EthernetPort>
<!--ro, opt, object, network interface-->
<id min="1" max="4">
<!--ro, req, int, ID, attr:min{req, int},max{req, int}-->1
## </id>
<MACAddress>
<!--ro, req, string, MAC address-->test
</MACAddress>
<status opt="connected,disconnect">
<!--ro, opt, enum, status, subType:string, attr:opt{req, string}, desc:status-->connected
## </status>
<speed opt="10,100,1000,10000">
<!--ro, req, enum, speed, subType:int, attr:opt{req, string}, desc:"10,100,1000,10000"-->10
## </speed>
</EthernetPort>
</EthernetPortList>
<Extensions>
<!--ro, opt, object, extension information-->
<NetworkCardType opt="normal,internal,external,main,wired">
<!--ro, opt, enum, NIC type, subType:string, attr:opt{req, string}-->normal
</NetworkCardType>
</Extensions>
<interfaceName min="1" max="10">
<!--ro, opt, string, NIC name, attr:min{req, int},max{req, int}-->test
</interfaceName>
<LANConfigMode opt="manual,auto">
<!--ro, opt, string, attr:opt{req, string}-->test
</LANConfigMode>
<enabled opt="true,false">
<!--ro, opt, bool, attr:opt{req, string}-->true
## </enabled>
<isSupportSerialNumberInURL>
<!--ro, opt, bool, whether URL supports containing serialNumber-->true
</isSupportSerialNumberInURL>
<softStorageinterfaceEnabled opt="true,false">
<!--ro, opt, bool, attr:opt{req, string}-->true
</softStorageinterfaceEnabled>
<dualControlNICList size="2">
<!--ro, opt, array, subType:object, attr:size{req, int}-->
<dualControlNIC>
<!--ro, opt, object-->
<role opt="controllerA,controllerB">
<!--ro, req, enum, subType:string, attr:opt{req, string}-->controllerA
## </role>
<ipV4Address>
<!--ro, opt, ipv4-->10.255.255.0
</ipV4Address>
</dualControlNIC>
</dualControlNICList>
</NetworkInterface>
statusCodestatusStringsubStatusCodeerrorCodedescription
## 4
## Invalid
## Operation
theCurrentPoeModeDoesNotSupportNetworkParameterConfiguration0x4000A214--
Request URL
7.2.1.3 Set the IP address
Hikvision co MMC
adil@hikvision.co.az

PUT /ISAPI/System/Network/interfaces/<interfaceID>/ipAddress
## Query Parameter
Parameter NameParameter TypeDescription
interfaceIDstring--
## Request Message
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<IPAddress xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--req, object, IP address parameters, attr:version{req, string, protocolVersion}-->
<ipVersion>
<!--req, enum, IP address version, subType:string, desc:IP address version-->v4
</ipVersion>
<addressingType>
<!--req, enum, address type, subType:string, desc:address type-->static
</addressingType>
<ipAddress>
<!--opt, string, IPv4 address-->test
</ipAddress>
<subnetMask>
<!--opt, string, IPv4 subnet mask-->test
</subnetMask>
<ipv6Address>
<!--opt, string, IPv6 address-->test
</ipv6Address>
<bitMask>
<!--opt, string, IPv6 subnet mask-->test
</bitMask>
<DefaultGateway>
<!--opt, object, default gateway-->
<ipAddress>
<!--opt, string, IPv4 address-->test
</ipAddress>
<ipv6Address>
<!--opt, string, IPv6 address-->test
</ipv6Address>
</DefaultGateway>
<PrimaryDNS>
<!--opt, object-->
<ipAddress>
<!--opt, string, IPv4 address-->test
</ipAddress>
<ipv6Address>
<!--opt, string, IPv6 address-->test
</ipv6Address>
</PrimaryDNS>
<SecondaryDNS>
<!--opt, object, reserved DNS-->
<ipAddress>
<!--opt, string, IPv4 address-->test
</ipAddress>
<ipv6Address>
<!--opt, string, IPv6 address-->test
</ipv6Address>
</SecondaryDNS>
<DNSEnable>
<!--opt, bool-->true
</DNSEnable>
<Ipv6Mode>
<!--opt, object-->
<ipV6AddressingType>
<!--opt, enum, subType:string-->ra
</ipV6AddressingType>
<ipv6AddressList>
<!--opt, array, subType:object-->
<v6Address>
<!--opt, object, IPv6 address-->
## <id>
<!--opt, string-->test
## </id>
## <type>
<!--opt, enum, subType:string-->ra
## </type>
## <address>
<!--opt, string, IPv6 address-->test
## </address>
<bitMask>
<!--opt, string-->test
</bitMask>
</v6Address>
</ipv6AddressList>
</Ipv6Mode>
<DoubleNetRoute>
<!--opt, object-->
<ipAddress>
<!--opt, string, IP address-->test
</ipAddress>
<subnetMask>
<!--opt, string, subnet mask-->test
</subnetMask>
</DoubleNetRoute>
<LANConfigMode>
<!--opt, enum, subType:string-->manual
</LANConfigMode>
</IPAddress>
Hikvision co MMC
adil@hikvision.co.az

## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
(Invalid XML Content), 7 (Reboot Required)-->0
</statusCode>
<statusString>
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
"Invalid XML Content", "Reboot" (reboot device)-->OK
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, which describes the error in details, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
</ResponseStatus>
statusCodestatusStringsubStatusCodeerrorCodedescription
3Device ErrordeviceError0x30000001--
4Invalid OperationinvalidOperation0x40000006--
6Invalid ContentbadIPv4Address0x60000004--
6Invalid ContentbadIPv6Address0x60000005--
6Invalid ContentconflictIPv4Address0x60000006--
6Invalid ContentconflictIPv6Address0x60000007--
6Invalid ContentbadNetMask0x6000000E--
Request URL
GET /ISAPI/System/Network/interfaces/<interfaceID>/ipAddress
## Query Parameter
Parameter NameParameter TypeDescription
interfaceIDstring--
## Request Message
## None
## Response Message
7.2.1.4 Get the IP address parameters
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<IPAddress xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, attr:version{req, string, protocolVersion}-->
<ipVersion>
<!--ro, req, enum, subType:string-->v4
</ipVersion>
<addressingType>
<!--ro, req, enum, subType:string-->static
</addressingType>
<ipAddress>
<!--ro, opt, string-->test
</ipAddress>
<subnetMask>
<!--ro, opt, string-->test
</subnetMask>
<ipv6Address>
<!--ro, opt, string-->test
</ipv6Address>
<bitMask>
<!--ro, opt, string-->test
</bitMask>
<DefaultGateway>
<!--ro, opt, object-->
<ipAddress>
<!--ro, opt, string-->test
</ipAddress>
<ipv6Address>
<!--ro, opt, string-->test
</ipv6Address>
</DefaultGateway>
<PrimaryDNS>
<!--ro, opt, object-->
<ipAddress>
<!--ro, opt, string-->test
</ipAddress>
<ipv6Address>
<!--ro, opt, string-->test
</ipv6Address>
</PrimaryDNS>
<SecondaryDNS>
<!--ro, opt, object-->
<ipAddress>
<!--ro, opt, string-->test
</ipAddress>
<ipv6Address>
<!--ro, opt, string-->test
</ipv6Address>
</SecondaryDNS>
<DNSEnable>
<!--ro, opt, bool-->true
</DNSEnable>
<Ipv6Mode>
<!--ro, opt, object-->
<ipV6AddressingType>
<!--ro, opt, enum, subType:string-->ra
</ipV6AddressingType>
<ipv6AddressList>
<!--ro, opt, array, subType:object-->
<v6Address>
<!--ro, opt, object-->
## <id>
<!--ro, opt, string-->test
## </id>
## <type>
<!--ro, opt, enum, subType:string-->ra
## </type>
## <address>
<!--ro, opt, string-->test
## </address>
<bitMask>
<!--ro, opt, string-->test
</bitMask>
</v6Address>
</ipv6AddressList>
</Ipv6Mode>
<DoubleNetRoute>
<!--ro, opt, object-->
<ipAddress>
<!--ro, opt, string-->test
</ipAddress>
<subnetMask>
<!--ro, opt, string-->test
</subnetMask>
</DoubleNetRoute>
<LANConfigMode>
<!--ro, opt, enum, subType:string-->manual
</LANConfigMode>
</IPAddress>
Hikvision co MMC
adil@hikvision.co.az

Request URL
PUT /ISAPI/System/Network/interfaces/<interfaceID>/link
## Query Parameter
Parameter NameParameter TypeDescription
interfaceIDstring--
## Request Message
<?xml version="1.0" encoding="UTF-8"?>
<Link xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--req, object, NIC connection information, attr:version{req, string, protocolVersion}-->
<MACAddress>
<!--req, string, MAC address-->test
</MACAddress>
<autoNegotiation>
<!--req, bool, whether to enable the auto-negotiation-->true
</autoNegotiation>
## <speed>
<!--opt, enum, link speed, subType:int, desc:link speed-->10
## </speed>
## <duplex>
<!--opt, enum, "half,full", subType:string, desc:"half" (half duplex), "full" (full duplex)-->half
## </duplex>
## <MTU>
<!--req, int, MTU-->1
## </MTU>
<linkMode>
<!--opt, enum, connect mode, subType:string, desc:"optical", "electrical"-->optical
</linkMode>
</Link>
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
(Invalid XML Content), 7 (Reboot Required)-->0
</statusCode>
<statusString>
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
"Invalid XML Content", "Reboot" (reboot device)-->OK
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, which describes the error in details, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/System/Network/interfaces/<interfaceID>/link
## Query Parameter
Parameter NameParameter TypeDescription
interfaceIDstring--
## Request Message
## None
## Response Message
7.2.1.5 Set the connection parameters of a specific network interface
7.2.1.6 Get the connection parameters of a specific NIC
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<Link xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, NIC connection information, attr:version{req, string, protocolVersion}-->
<MACAddress>
<!--ro, req, string, MAC address-->test
</MACAddress>
<autoNegotiation>
<!--ro, req, bool, whether to enable the auto-negotiation-->true
</autoNegotiation>
## <speed>
<!--ro, opt, enum, link speed, subType:int, desc:10 (10M), 100 (100M), 1000 (1000M)-->10
## </speed>
## <duplex>
<!--ro, opt, enum, duplex mode, subType:string, desc:"half" (half duplex), "full" (full duplex)-->half
## </duplex>
## <MTU>
<!--ro, req, int, MTU-->1
## </MTU>
<linkMode>
<!--ro, opt, enum, connection mode, subType:string, desc:"optical", "electrical"-->optical
</linkMode>
</Link>
Request URL
PUT /ISAPI/System/Network/interfaces/<interfaceID>?serialNumber=<serialNumber>
## Query Parameter
Parameter NameParameter TypeDescription
interfaceIDstring--
serialNumberstring--
## Request Message
<?xml version="1.0" encoding="UTF-8"?>
<NetworkInterface xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--req, object, IP address parameters, attr:version{req, string, protocolVersion}-->
## <id>
<!--req, string, NIC index-->test
## </id>
<IPAddress>
<!--req, object, IP address parameters-->
<ipVersion>
<!--req, enum, IP address version, subType:string, desc:"v4" (IPv4), "v6" (IPv6), "dual" (IPv4 and IPv6)-->v4
</ipVersion>
<addressingType>
<!--req, enum, address type, subType:string, desc:"static", "dynamic", "apipa" (automatic private IP addressing)-->static
</addressingType>
<ipAddress>
<!--opt, string, IPv4 address-->test
</ipAddress>
<subnetMask>
<!--opt, string, IPv4 subnet mask-->test
</subnetMask>
<ipv6Address>
<!--opt, string, IPv6 address-->test
</ipv6Address>
<bitMask>
<!--opt, string, IPv6 subnet mask-->test
</bitMask>
<DefaultGateway>
<!--opt, object, default gateway-->
<ipAddress>
<!--opt, string, IPv4 address-->test
</ipAddress>
<ipv6Address>
<!--opt, string, IPv6 address-->test
</ipv6Address>
</DefaultGateway>
<PrimaryDNS>
<!--opt, object, preferred DNS-->
<ipAddress>
<!--opt, string, IPv4 address-->test
</ipAddress>
<ipv6Address>
<!--opt, string, IPv6 address-->test
</ipv6Address>
</PrimaryDNS>
7.2.1.7 Set parameters of a specific network interface
Hikvision co MMC
adil@hikvision.co.az

<SecondaryDNS>
<!--opt, object, alternate DNS-->
<ipAddress>
<!--opt, string, IPv4 address-->test
</ipAddress>
<ipv6Address>
<!--opt, string, IPv6 address-->test
</ipv6Address>
</SecondaryDNS>
<DNSEnable>
<!--opt, bool-->true
</DNSEnable>
<Ipv6Mode>
<!--opt, object, IPv6 mode-->
<ipV6AddressingType>
<!--opt, enum, IPv6 address type, subType:string, desc:"ra" (router advertisement), "manual" (manual assignment), "dhcp" (DHCP server assignment)--
## >ra
</ipV6AddressingType>
<ipv6AddressList>
<!--opt, array, IPv6 address list, subType:object-->
<v6Address>
<!--opt, object, IPv6 address-->
## <id>
<!--opt, string, IPv6 address index-->test
## </id>
## <type>
<!--opt, enum, IPv6 address type, subType:string, desc:"ra" (router advertisement), "manual" (manual assignment), "dhcp" (DHCP server
assignment)-->ra
## </type>
## <address>
<!--opt, string, IPv6 address-->test
## </address>
<bitMask>
<!--opt, string, IPv6 subnet mask-->test
</bitMask>
</v6Address>
</ipv6AddressList>
</Ipv6Mode>
<DoubleNetRoute>
<!--opt, object, dual WAN router-->
<ipAddress>
<!--opt, string, IP address-->test
</ipAddress>
<subnetMask>
<!--opt, string, sub-net mask-->test
</subnetMask>
</DoubleNetRoute>
<LANConfigMode>
<!--opt, enum, subType:string-->manual
</LANConfigMode>
<DoubleNetRouteList>
<!--opt, array, subType:object, desc:in dual network isolation mode, up to four router configurations are supported; the address of the first router
needs to be configured via DoubleNetRoute, and the additional expansion routes can be configured through this node-->
<DoubleNetRoute>
<!--opt, object, dual WAN router-->
<ipAddress>
<!--opt, string, IP address-->test
</ipAddress>
<subnetMask>
<!--opt, string, subnet mask-->test
</subnetMask>
</DoubleNetRoute>
</DoubleNetRouteList>
<ipv6Enabled>
<!--opt, bool-->true
</ipv6Enabled>
</IPAddress>
<Wireless>
<!--opt, object-->
## <enabled>
<!--req, bool-->true
## </enabled>
<wirelessNetworkMode>
<!--opt, enum, subType:string-->infrastructure
</wirelessNetworkMode>
## <channel>
<!--opt, string-->test
## </channel>
## <ssid>
<!--opt, string, SSID (Service Set Identifier)-->test
## </ssid>
<wmmEnabled>
<!--opt, bool, enable WMM (Wi-Fi multimedia)-->true
</wmmEnabled>
<WirelessSecurity>
<!--opt, object, wireless network security-->
<securityMode>
<!--opt, enum, security mode, subType:string-->disable
</securityMode>
## <WEP>
<!--opt, object, dep:or,{$.NetworkInterface.Wireless.WirelessSecurity.securityMode,eq,WEP}-->
<authenticationType>
<!--req, enum, authentication type, subType:string, desc:authentication type-->open
</authenticationType>
Hikvision co MMC
adil@hikvision.co.az

</authenticationType>
<defaultTransmitKeyIndex>
<!--req, int, default number of transmitted keys-->1
</defaultTransmitKeyIndex>
<wepKeyLength>
<!--opt, int, key length, range:[64,128]-->1
</wepKeyLength>
<EncryptionKeyList>
<!--opt, array, subType:object-->
<encryptionKey>
<!--req, string, Secret key-->test
</encryptionKey>
</EncryptionKeyList>
## </WEP>
## <WPA>
<!--opt, object, WPA-personal, dep:or,{$.NetworkInterface.Wireless.WirelessSecurity.securityMode,eq,WPA}-->
<algorithmType>
<!--req, enum, algorithm type, subType:string, desc:algorithm type-->TKIP
</algorithmType>
<sharedKey>
<!--req, string, shared key authentication-->test
</sharedKey>
<wpaKeyLength>
<!--req, int, key length, range:[8,63]-->1
</wpaKeyLength>
## </WPA>
</WirelessSecurity>
<workScene>
<!--opt, enum, subType:string-->computerRoom
</workScene>
## <protocol>
<!--opt, enum, protocol type, subType:string, desc:protocol type-->802.11ac
## </protocol>
<protocolRealTime>
<!--opt, string, real-time mode-->test
</protocolRealTime>
<hideSsid>
<!--opt, bool, hidden SSID-->true
</hideSsid>
<ChannelConfig>
<!--opt, object, channel configuration-->
## <width>
<!--opt, enum, bandwidth, subType:string-->auto
## </width>
<autoWidth>
<!--ro, opt, string, bandwidth-->test
</autoWidth>
## <channel>
<!--opt, string-->test
## </channel>
<autoChannel>
<!--ro, opt, string, automatic channel-->test
</autoChannel>
<transmitPower>
<!--opt, enum, power load, subType:int-->9
</transmitPower>
<transmitPowerRealTime>
<!--opt, int, real-time power-->1
</transmitPowerRealTime>
<countryID>
<!--opt, int, country code-->1
</countryID>
</ChannelConfig>
## <rate>
<!--opt, enum, frequency, subType:string-->2.4GHz
## </rate>
<dialUpGroupNo>
<!--opt, string, SSID dial group No.-->test
</dialUpGroupNo>
<baseNoisevalue>
<!--ro, opt, int, background noise value, step:1-->1
</baseNoisevalue>
</Wireless>
<Discovery>
<!--opt, object, the network discovery configuration-->
<UPnP>
<!--req, object, UPnP-->
## <enabled>
<!--req, bool, whether to enable UPnP-->true
## </enabled>
</UPnP>
<Zeroconf>
<!--opt, object-->
## <enabled>
<!--req, bool-->true
## </enabled>
</Zeroconf>
</Discovery>
<Link>
<!--opt, object, NIC connection information-->
<MACAddress>
<!--req, string, MAC address-->test
</MACAddress>
<autoNegotiation>
Hikvision co MMC
adil@hikvision.co.az

<autoNegotiation>
<!--req, bool, whether to enable the auto-negotiation-->true
</autoNegotiation>
## <speed>
<!--req, enum, "10,100,1000,10000", subType:int, desc:"10,100,1000,10000"-->10
## </speed>
## <duplex>
<!--req, enum, duplex mode, subType:string-->half
## </duplex>
## <MTU>
<!--req, int, MTU-->1
## </MTU>
<linkMode>
<!--opt, enum, connection mode, subType:string, desc:"optical", "electrical"-->optical
</linkMode>
</Link>
<defaultConnection>
<!--opt, bool, whether it is the default network connection, desc:whether it is the default network connection-->true
</defaultConnection>
<ActiveMulticast>
<!--opt, object-->
## <enabled>
<!--req, bool, whether to enable-->true
## </enabled>
<streamID>
<!--req, enum, stream type, subType:string-->main
</streamID>
<ipV4Address>
<!--opt, string, IPV4 address-->test
</ipV4Address>
<ipV6Address>
<!--opt, string, IPv6 address-->test
</ipV6Address>
## <port>
<!--opt, int, port No.-->1
## </port>
</ActiveMulticast>
<macAddress>
<!--opt, string, MAC address-->test
</macAddress>
<EthernetPortList>
<!--opt, array, ethernet port information list, subType:object-->
<EthernetPort>
<!--opt, object, ethernet port information-->
## <id>
<!--req, int, port ID, range:[1,4]-->1
## </id>
<MACAddress>
<!--req, string, MAC address-->test
</MACAddress>
## <status>
<!--opt, enum, connection status, subType:string, desc:disconnect"-->connected
## </status>
## <speed>
<!--req, enum, "10,100,1000,10000", subType:string, desc:"10,100,1000,10000"-->10
## </speed>
</EthernetPort>
</EthernetPortList>
<Extensions>
<!--opt, object, extension information-->
<NetworkCardType>
<!--opt, enum, NIC type, subType:string-->normal
</NetworkCardType>
</Extensions>
<interfaceName>
<!--opt, string, NIC name-->test
</interfaceName>
## <enabled>
<!--opt, bool-->true
## </enabled>
<softStorageinterfaceEnabled>
<!--ro, opt, bool-->true
</softStorageinterfaceEnabled>
<dualControlNICList>
<!--ro, opt, array, subType:object, range:[1,2]-->
<dualControlNIC>
<!--ro, opt, object-->
## <role>
<!--ro, req, enum, subType:string-->controllerA
## </role>
<ipV4Address>
<!--ro, opt, string-->10.255.255.0
</ipV4Address>
</dualControlNIC>
</dualControlNICList>
</NetworkInterface>
## Response Message
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
<requestURL>
<!--ro, opt, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
(Invalid XML Content), 7 (Reboot Required)-->0
</statusCode>
<statusString>
<!--ro, req, enum, status description, subType:string, desc:"OK", "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format", "Invalid XML
Content", "Reboot"-->OK
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:read-only,describe the error reason in detail-->OK
</subStatusCode>
## <description>
<!--ro, opt, string, custom error message description, range:[0,1024], desc:the custom error message description returned by the application is used to
quickly identify and evaluate issues-->badXmlFormat
## </description>
<MErrCode>
<!--ro, opt, string, error codes categorized by functional modules, desc:all general error codes are in the range of this field-->0x00000000
</MErrCode>
<MErrDevSelfEx>
<!--ro, opt, string, error codes categorized by functional modules, desc:N/A-->0x00000000
</MErrDevSelfEx>
</ResponseStatus>
statusCodestatusStringsubStatusCodeerrorCodedescription
4Invalid OperationwifiIsOpenedUnableToConnectWiredNetwork0x4000A56F--
4Invalid OperationtheNetworkCardHasNotEnabledTheIpv6Protocol0x4000A5E4--
Request URL
GET /ISAPI/System/Network/interfaces/<interfaceID>?serialNumber=<serialNumber>
## Query Parameter
Parameter NameParameter TypeDescription
interfaceIDstring--
serialNumberstring--
## Request Message
## None
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<NetworkInterface xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, IP address parameters, attr:version{req, string, protocolVersion}-->
## <id>
<!--ro, req, string, NIC index-->test
## </id>
<IPAddress>
<!--ro, req, object, IP address parameters-->
<ipVersion>
<!--ro, req, enum, IP address version, subType:string-->v4
</ipVersion>
<addressingType>
<!--ro, req, enum, address type, subType:string-->static
</addressingType>
<ipAddress>
<!--ro, opt, string, IPv4 address-->test
</ipAddress>
<subnetMask>
<!--ro, opt, string, IPv4 subnet mask-->test
</subnetMask>
<ipv6Address>
<!--ro, opt, string, IPv6 address-->test
</ipv6Address>
<bitMask>
<!--ro, opt, string, IPv6 subnet mask-->test
7.2.1.8 Get the information of a specific network interface.
Hikvision co MMC
adil@hikvision.co.az

</bitMask>
<DefaultGateway>
<!--ro, opt, object-->
<ipAddress>
<!--ro, opt, string, IPv4 address-->test
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address-->test
</ipv6Address>
</DefaultGateway>
<PrimaryDNS>
<!--ro, opt, object-->
<ipAddress>
<!--ro, opt, string, IPv4 address-->test
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address-->test
</ipv6Address>
</PrimaryDNS>
<SecondaryDNS>
<!--ro, opt, object-->
<ipAddress>
<!--ro, opt, string, IPv4 address-->test
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address-->test
</ipv6Address>
</SecondaryDNS>
<DNSEnable>
<!--ro, opt, bool-->true
</DNSEnable>
<Ipv6Mode>
<!--ro, opt, object-->
<ipV6AddressingType>
<!--ro, opt, enum, subType:string-->ra
</ipV6AddressingType>
<ipv6AddressList>
<!--ro, opt, array, subType:object-->
<v6Address>
<!--ro, opt, object, IPv6 address-->
## <id>
<!--ro, opt, string-->test
## </id>
## <type>
<!--ro, opt, enum, subType:string-->ra
## </type>
## <address>
<!--ro, opt, string, IPv6 address-->test
## </address>
<bitMask>
<!--ro, opt, string, IPv6 subnet mask-->test
</bitMask>
</v6Address>
</ipv6AddressList>
</Ipv6Mode>
<DoubleNetRoute>
<!--ro, opt, object-->
<ipAddress>
<!--ro, opt, string, IP address-->test
</ipAddress>
<subnetMask>
<!--ro, opt, string, subnet mask-->test
</subnetMask>
</DoubleNetRoute>
<LANConfigMode>
<!--ro, opt, enum, subType:string-->manual
</LANConfigMode>
<DoubleNetRouteList>
<!--ro, opt, array, subType:object-->
<DoubleNetRoute>
<!--ro, opt, object-->
<ipAddress>
<!--ro, opt, string, IP address-->test
</ipAddress>
<subnetMask>
<!--ro, opt, string, subnet mask-->test
</subnetMask>
</DoubleNetRoute>
</DoubleNetRouteList>
</IPAddress>
<Wireless>
<!--ro, opt, object-->
## <enabled>
<!--ro, req, bool-->true
## </enabled>
<wirelessNetworkMode>
<!--ro, opt, enum, subType:string-->infrastructure
</wirelessNetworkMode>
## <channel>
<!--ro, opt, string-->test
## </channel>
## <ssid>
<!--ro, opt, string, SSID (Service Set Identifier)-->test
## </ssid>
Hikvision co MMC
adil@hikvision.co.az

## </ssid>
<wmmEnabled>
<!--ro, opt, bool-->true
</wmmEnabled>
<WirelessSecurity>
<!--ro, opt, object-->
<securityMode>
<!--ro, opt, enum, subType:string-->disable
</securityMode>
## <WEP>
<!--ro, opt, object, dep:or,{$.NetworkInterface.Wireless.WirelessSecurity.securityMode,eq,WEP}-->
<authenticationType>
<!--ro, req, enum, authentication type, subType:string-->open
</authenticationType>
<defaultTransmitKeyIndex>
<!--ro, req, int-->1
</defaultTransmitKeyIndex>
<wepKeyLength>
<!--ro, opt, int, range:[64,128]-->1
</wepKeyLength>
<EncryptionKeyList>
<!--ro, opt, array, subType:object-->
<encryptionKey>
<!--ro, req, string, access key-->test
</encryptionKey>
</EncryptionKeyList>
## </WEP>
## <WPA>
<!--ro, opt, object, dep:or,{$.NetworkInterface.Wireless.WirelessSecurity.securityMode,eq,WPA}-->
<algorithmType>
<!--ro, req, enum, algorithm type, subType:string-->TKIP
</algorithmType>
<sharedKey>
<!--ro, req, string-->test
</sharedKey>
<wpaKeyLength>
<!--ro, req, int, range:[8,63]-->1
</wpaKeyLength>
## </WPA>
</WirelessSecurity>
<workScene>
<!--ro, opt, enum, subType:string-->computerRoom
</workScene>
## <protocol>
<!--ro, opt, enum, protocol type, subType:string-->802.11ac
## </protocol>
<protocolRealTime>
<!--ro, opt, string, real-time mode-->test
</protocolRealTime>
<hideSsid>
<!--ro, opt, bool-->true
</hideSsid>
<ChannelConfig>
<!--ro, opt, object-->
## <width>
<!--ro, opt, enum, subType:string-->auto
## </width>
<autoWidth>
<!--ro, opt, string-->test
</autoWidth>
## <channel>
<!--ro, opt, string-->test
## </channel>
<autoChannel>
<!--ro, opt, string-->test
</autoChannel>
<transmitPower>
<!--ro, opt, enum, subType:int-->9
</transmitPower>
<transmitPowerRealTime>
<!--ro, opt, int-->1
</transmitPowerRealTime>
<countryID>
<!--ro, opt, int-->1
</countryID>
</ChannelConfig>
## <rate>
<!--ro, opt, enum, subType:string-->2.4GHz
## </rate>
<dialUpGroupNo>
<!--ro, opt, string-->test
</dialUpGroupNo>
<baseNoisevalue>
<!--ro, opt, int, step:1-->1
</baseNoisevalue>
</Wireless>
<Discovery>
<!--ro, opt, object-->
<UPnP>
<!--ro, req, object-->
## <enabled>
<!--ro, req, bool-->true
## </enabled>
</UPnP>
Hikvision co MMC
adil@hikvision.co.az

</UPnP>
<Zeroconf>
<!--ro, opt, object-->
## <enabled>
<!--ro, req, bool-->true
## </enabled>
</Zeroconf>
</Discovery>
<Link>
<!--ro, opt, object-->
<MACAddress>
<!--ro, req, string, MAC address-->test
</MACAddress>
<autoNegotiation>
<!--ro, req, bool-->true
</autoNegotiation>
## <speed>
<!--ro, req, enum, "10,100,1000,10000", subType:int, desc:"10,100,1000,10000"-->10
## </speed>
## <duplex>
<!--ro, req, enum, subType:string-->half
## </duplex>
## <MTU>
<!--ro, req, int, MTU-->1
## </MTU>
<linkMode>
<!--ro, opt, enum, connect mode, subType:string-->optical
</linkMode>
</Link>
<defaultConnection>
<!--ro, opt, bool, wether to enable default network connection-->true
</defaultConnection>
<ActiveMulticast>
<!--ro, opt, object-->
## <enabled>
<!--ro, req, bool, whether to enable or not-->true
## </enabled>
<streamID>
<!--ro, req, enum, subType:string-->main
</streamID>
<ipV4Address>
<!--ro, opt, string, IPv4 address-->test
</ipV4Address>
<ipV6Address>
<!--ro, opt, string, IPv6 address-->test
</ipV6Address>
## <port>
<!--ro, opt, int, port No.-->1
## </port>
</ActiveMulticast>
<macAddress>
<!--ro, opt, string, MAC Address-->test
</macAddress>
<EthernetPortList>
<!--ro, opt, array, network interface information list, subType:object-->
<EthernetPort>
<!--ro, opt, object-->
## <id>
<!--ro, req, int, range:[1,4]-->1
## </id>
<MACAddress>
<!--ro, req, string, MAC Address-->test
</MACAddress>
## <status>
<!--ro, opt, enum, connection status, subType:string, desc:disconnect"-->connected
## </status>
## <speed>
<!--ro, req, enum, speed, subType:string, desc:"10,100,1000,10000"-->10
## </speed>
</EthernetPort>
</EthernetPortList>
<Extensions>
<!--ro, opt, object, extended information-->
<NetworkCardType>
<!--ro, opt, enum, subType:string-->normal
</NetworkCardType>
</Extensions>
<interfaceName>
<!--ro, opt, string-->test
</interfaceName>
</NetworkInterface>
## 7.3 Credentials Collection
## 7.3.1 Card Online Collection
7.3.1.1 Get the capability of collecting card information
Hikvision co MMC
adil@hikvision.co.az

Request URL
GET /ISAPI/AccessControl/CaptureCardInfo/capabilities?format=json
## Query Parameter
## None
## Request Message
## None
## Response Message
## {
"CardInfoCap": {
/*ro, req, object*/
"cardNo": {
/*ro, opt, object, card No.*/
## "@min":  1,
/*ro, req, int, the minimum length, range:[1,32]*/
## "@max":  32
/*ro, req, int, the maximum length, range:[1,32]*/
## },
"cardType": ["TypeA_M1", "TypeA_CPU", "TypeB", "ID_125K", "FelicaCard", "DesfireCard"],
/*ro, opt, array, card type, subType:string, range:[1,6]*/
"readerID": {
/*ro, opt, object*/
## "@min":  1,
/*ro, req, int*/
## "@max":  8
/*ro, req, int*/
## }
## }
## }
Request URL
GET /ISAPI/AccessControl/CaptureCardInfo?format=json&readerID=<readerID>
## Query Parameter
Parameter NameParameter TypeDescription
readerIDstring--
## Request Message
## None
## Response Message
## {
"CardInfo": {
/*ro, req, object, card information*/
"cardNo":  "abcd1234",
/*ro, req, string, card No.*/
"cardType":  "TypeA_M1",
/*ro, opt, enum, card type, subType:string, desc:"TypeA_M1", "TypeA_CPU", "TypeB", "ID_125K", "FelicaCard” (FeliCa card), "DesfireCard” (DESFire
card)*/
"readerID":  1
/*ro, opt, int, range:[1,8]*/
## }
## }
Request URL
POST /ISAPI/AccessControl/CaptureFaceData
## Query Parameter
## None
7.3.1.2 Collect card information by the card reading module of the device
## 7.3.2 Face Picture Collecting
7.3.2.1 Collect face picture information
Hikvision co MMC
adil@hikvision.co.az

## Request Message
<?xml version="1.0" encoding="UTF-8"?>
<CaptureFaceDataCond xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--req, object, attr:version{req, string, protocolVersion}-->
<captureInfrared>
<!--opt, bool, whether to collect infrared face pictures simultaneously, desc:"true"-yes, "false"-no-->true
</captureInfrared>
<dataType>
<!--opt, enum, data type of collected face pictures, subType:string, desc:"url" (default), "binary”-->url
</dataType>
<readerID>
<!--opt, int, range:[1,8]-->1
</readerID>
</CaptureFaceDataCond>
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<CaptureFaceData xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, attr:version{req, string, protocolVersion}-->
<CaptureFaceDataCond>
<!--ro, opt, object-->
<captureInfrared opt="true,false">
<!--ro, opt, bool, attr:opt{req, string}-->true
</captureInfrared>
<dataType opt="url,binary">
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->url
</dataType>
</CaptureFaceDataCond>
<faceDataUrl min="1" max="768">
<!--ro, opt, string, face data URL, if this node does not exist, it indicates that there is no face data, attr:min{req, int},max{req, int}-->test
</faceDataUrl>
<captureProgress min="1" max="10">
<!--ro, opt, int, collection progress, range:[0,100], attr:min{req, int},max{req, int}-->1
</captureProgress>
<infraredFaceDataUrl min="1" max="100">
<!--ro, opt, string, infrared face data URL, if this node does not exist, it indicates that there is no infrared face data, attr:min{req, int},max{req,
int}-->test
</infraredFaceDataUrl>
<modelData>
<!--ro, opt, string-->test
</modelData>
## <score>
<!--ro, opt, int, face score (face picture quality), range:[0,100]-->0
## </score>
<thermometryUnit>
<!--ro, opt, string-->test
</thermometryUnit>
<currTemperature>
<!--ro, opt, float-->0.0
</currTemperature>
<visibleLightURL>
<!--ro, opt, string-->test
</visibleLightURL>
<thermalURL>
<!--ro, opt, string, thermal imaging picture URL-->test
</thermalURL>
</CaptureFaceData>
## Parameter
## Name
## Parameter
## Value
Parameter Type(Content-
## Type)
## Content-
## ID
File NameDescription
CaptureFace
[Message
content]
application/xml------
FaceData
[Binary picture
data]
image/jpegFaceDatac--
InfraredFaceData
[Binary picture
data]
image/jpegInfraredFaceData.jpg--
faceMatting
[Binary picture
data]
image/jpegfaceMatting.jpg--
Hikvision co MMC
adil@hikvision.co.az

Note： The protocol is transmitted in form format. See Chapter 4.5.1.4 for form framework description, as shown in
the instance below.
## --<frontier>
Content-Disposition: form-data; name=Parameter Name;filename=File Name
Content-Type: Parameter Type
Content-Length: ****
Content-ID: Content ID
## Parameter Value
statusCodestatusStringsubStatusCodeerrorCodedescription
2Device BusydeviceBusy0x20000004--
3Device ErrorcaptureTimeout0x30006000--
4Invalid OperationfileUploadFailed0x4000600A--
4Invalid OperationfaceLowQulity0x40006010--
4Invalid OperationfacePictureAndIdPhotoMismatch0x4000A1CD--
Request URL
GET /ISAPI/AccessControl/CaptureFaceData/capabilities
## Query Parameter
## None
## Request Message
## None
## Response Message
Parameter Name: the name property of Content-Disposition in the header of form unit; it refers to the form unit
name.
Parameter Type (Content-Type): the Content-Type property in the header of form unit.
File Name (filename): the filename property of Content-Disposition of form unit Headers. It exists only when the
transmitted data of form unit is file, and it refers to the file name of form unit body.
Parameter Value: the body content of form unit.
7.3.2.2 Get the capability of collecting face picture information.
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<CaptureFaceData xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, opt, object, capability of collecting face picture information, attr:version{req, string, protocolVersion}-->
<CaptureFaceDataCond>
<!--ro, req, bool, whether to collect the infrared face data-->true
<captureInfrared opt="true,false">
<!--ro, opt, bool, whether to collect the infrared face data, attr:opt{req, string}-->true
</captureInfrared>
<dataType opt="url,binary">
<!--ro, opt, enum, data type of collected face pictures, subType:string, attr:opt{req, string}, desc:url (URL, default),binary (binary)-->url
</dataType>
</CaptureFaceDataCond>
<faceDataUrl min="1" max="768">
<!--ro, opt, string, face data URL, range:[1,768], attr:min{req, int},max{req, int}-->1
</faceDataUrl>
<captureProgress min="1" max="10">
<!--ro, req, int, collection progress, range:[1,10], attr:min{req, int},max{req, int}-->1
</captureProgress>
<infraredFaceDataUrl min="1" max="100">
<!--ro, req, string, infrared picture URL, range:[1,100], attr:min{req, int},max{req, int}-->test
</infraredFaceDataUrl>
<modelData min="1" max="10">
<!--ro, opt, string, face modeling data encoded by Base64, attr:min{req, int},max{req, int}-->test
</modelData>
<score min="0" max="100">
<!--ro, opt, int, face score, range:[0,100], attr:min{req, int},max{req, int}-->80
## </score>
<thermometryUnit opt="celsius,fahrenheit,kelvin">
<!--ro, opt, string, temperature unit: celsius (Celsius, default), attr:opt{req, string}-->test
</thermometryUnit>
<currTemperature min="0" max="10">
<!--ro, opt, float, face temperature which is accurate to one decimal place, attr:min{req, int},max{req, int}-->0.000
</currTemperature>
<visibleLightURL min="0" max="10">
<!--ro, opt, string, URL of the visible light picture captured by the thermal camera, attr:min{req, int},max{req, int}-->test
</visibleLightURL>
<thermalURL min="0" max="10">
<!--ro, opt, string, thermal picture URL, attr:min{req, int},max{req, int}-->test
</thermalURL>
<readerID min="1" max="8">
<!--ro, opt, int, range:[1,8], attr:min{req, int},max{req, int}-->1
</readerID>
</CaptureFaceData>
Request URL
GET /ISAPI/AccessControl/CaptureFaceData/Progress/capabilities
## Query Parameter
## None
## Request Message
## None
## Response Message
7.3.2.3 Get capability of getting face picture collection progress
Hikvision co MMC
adil@hikvision.co.az

<?xml version="1.0" encoding="UTF-8"?>
<CaptureFaceData xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, attr:version{req, string, protocolVersion}-->
<faceDataUrl min="0" max="10">
<!--ro, opt, string, face data URL, range:[1,32], attr:min{req, int},max{req, int}, desc:face data URL,if this node does not exist,it indicates that
there is no face data-->test
</faceDataUrl>
<captureProgress min="0" max="100">
<!--ro, req, int, collection progress, range:[0,100], attr:min{req, int},max{req, int}, desc:collection progress,which is between 0 and 100,0-no face
data collected,100-collected,the face data URL can be parsed only when the progress is 100-->1
</captureProgress>
<isCurRequestOver opt="true,false">
<!--ro, opt, bool, whether the current collection request is completed, attr:opt{req, string}-->true
</isCurRequestOver>
<infraredFaceDataUrl min="0" max="10">
<!--ro, opt, string, infrared face data URL, range:[1,32], attr:min{req, int},max{req, int}, desc:if this node does not exist, it indicates that there
is no infrared face data-->test
</infraredFaceDataUrl>
<readerID min="1" max="8">
<!--ro, opt, int, range:[1,8], attr:min{req, int},max{req, int}-->1
</readerID>
<requireReaderID>
<!--ro, opt, bool-->true
</requireReaderID>
</CaptureFaceData>
Request URL
GET /ISAPI/AccessControl/CaptureFaceData/Progress?readerID=<readerID>
## Query Parameter
Parameter NameParameter TypeDescription
readerIDstringThe intelligent host supports capturing faces by card reader.
## Request Message
## None
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<CaptureFaceData xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, opt, object, attr:version{req, string, protocolVersion}-->
<faceDataUrl>
<!--ro, opt, string, face data URL, range:[1,32]-->test
</faceDataUrl>
<captureProgress>
<!--ro, req, int, collection progress, range:[0,100], desc:collection progress,which is between 0 and 100,0-no face data collected,100-collected,the
face data URL can be parsed only when the progress is 100-->100
</captureProgress>
<isCurRequestOver>
<!--ro, opt, bool, whether the current collection request is completed, desc:whether the current collection request is completed: "true"-yes,"false"-no-
## ->true
</isCurRequestOver>
<infraredFaceDataUrl>
<!--ro, opt, string, infrared face data URL, range:[1,32], desc:if this node does not exist, it indicates that there is no infrared face data-->test
</infraredFaceDataUrl>
<faceMattingURL>
<!--ro, opt, string, range:[1,32]-->test
</faceMattingURL>
</CaptureFaceData>
statusCodestatusStringsubStatusCodeerrorCodedescription
4Invalid OperationfileUploadFailed0x4000600A--
Request URL
POST /ISAPI/AccessControl/CaptureFingerPrint
7.3.2.4 Get the progress of collecting face picture information
## 7.3.3 Fingerprint Online Collection
7.3.3.1 Collect fingerprint information
Hikvision co MMC
adil@hikvision.co.az

## Query Parameter
## None
## Request Message
<?xml version="1.0" encoding="UTF-8"?>
<CaptureFingerPrintCond xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--opt, object, Collect fingerprint information conditions, attr:version{req, string, protocolVersion}-->
<fingerNo>
<!--req, int, finger No., range:[1,10]-->1
</fingerNo>
</CaptureFingerPrintCond>
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<CaptureFingerPrint xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, attr:version{req, string, protocolVersion}-->
<fingerData>
<!--ro, opt, string, fingerprint data, range:[1,768], desc:which, should be encoded by Base64-->test
</fingerData>
<fingerNo>
<!--ro, req, int, finger No., range:[1,10]-->1
</fingerNo>
<fingerPrintQuality>
<!--ro, req, int, fingerprint quality, range:[1,100]-->1
</fingerPrintQuality>
</CaptureFingerPrint>
Parameter NameParameter Value
Parameter Type(Content-
## Type)
## Content-
## ID
File NameDescription
CaptureFingerPrint[Message content]application/xml------
fingerPrintPic
[Binary picture
data]
image/jpegfingerPrintPic.jpg--
Note： The protocol is transmitted in form format. See Chapter 4.5.1.4 for form framework description, as shown in
the instance below.
## --<frontier>
Content-Disposition: form-data; name=Parameter Name;filename=File Name
Content-Type: Parameter Type
Content-Length: ****
Content-ID: Content ID
## Parameter Value
statusCodestatusStringsubStatusCodeerrorCodedescription
2Device BusydeviceBusy0x20000004--
3Device ErrorcaptureTimeout0x30006000--
3Device ErrorfingerPrintLowQulity0x3000600B--
Request URL
Parameter Name: the name property of Content-Disposition in the header of form unit; it refers to the form unit
name.
Parameter Type (Content-Type): the Content-Type property in the header of form unit.
File Name (filename): the filename property of Content-Disposition of form unit Headers. It exists only when the
transmitted data of form unit is file, and it refers to the file name of form unit body.
Parameter Value: the body content of form unit.
7.3.3.2 Get the fingerprint collection capability
Hikvision co MMC
adil@hikvision.co.az

GET /ISAPI/AccessControl/CaptureFingerPrint/capabilities
## Query Parameter
## None
## Request Message
## None
## Response Message
<?xml version="1.0" encoding="UTF-8"?>
<CaptureFingerPrint xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, collect fingerprint information, attr:version{req, string, protocolVersion}-->
<CaptureFingerPrintCond>
<!--ro, req, object, finger No.-->
<fingerNo min="1" max="10">
<!--ro, opt, int, fingerprint No., range:[1,10], attr:min{req, int},max{req, int}-->1
</fingerNo>
</CaptureFingerPrintCond>
<fingerData min="1" max="768">
<!--ro, opt, string, fingerprint data, range:[1,768], attr:min{req, int},max{req, int}-->test
</fingerData>
<fingerNo min="1" max="10">
<!--ro, opt, int, fingerprint No., range:[1,10], attr:min{req, int},max{req, int}-->1
</fingerNo>
<fingerPrintQuality min="1" max="100">
<!--ro, opt, int, fingerprint quality, range:[1,100], attr:min{req, int},max{req, int}-->1
</fingerPrintQuality>
</CaptureFingerPrint>
Request URL
GET /ISAPI/AccessControl/OfflineCapture/capabilities?format=json
## Query Parameter
## None
## Request Message
## None
## Response Message
## {
"OfflineCaptureCap": {
/*ro, req, object, capability*/
"isSuportDownloadOfflineCaptureInfoTemplate":  true,
/*ro, opt, bool, whether it supports downloading the template of offline user list*/
"isSuportUploadOfflineCaptureInfo":  true,
/*ro, opt, bool, whether it supports uploading files with offline user list*/
"isSupportUserInfo":  true,
/*ro, opt, bool, whether it supports issuing the offline collection user information in JSON format*/
"isSupportDownloadCaptureData":  true,
/*ro, opt, bool, whether it supports downloading collected data*/
"isSupportDeleteAllData":  true,
/*ro, opt, bool, whether it supports deleting all collected data*/
"isSupportDeleteTheData":  true,
/*ro, opt, bool, whether it supports deleting specific collected data*/
"isSupportDeleteDataCollection":  true,
/*ro, opt, bool, whether it supports deleting collected data by conditions*/
"isSupportOfflineCaptureDataEvent":  true,
/*ro, opt, bool, whether it supports offline collection event*/
"isSupportOfflineCaptureDataEventConfirm":  true,
/*ro, opt, bool, whether it supports offline collection event acknowledgement, desc:/ISAPI/AccessControl/OfflineCapture/CaptureEventConfirm?
format=json*/
"SearchTask": {
/*ro, opt, object, Search capability*/
"supportFunction": {
/*ro, opt, object, supported methods*/
## "@opt": ["put", "get", "delete", "post"]
/*ro, req, array, options, subType:string*/
## },
"searchID": {
/*ro, opt, object, search ID*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## 7.3.4 Offline Collection
7.3.4.1 Get the offline collection capability
Hikvision co MMC
adil@hikvision.co.az

/*ro, req, int, the maximum length*/
## },
"maxResults": {
/*ro, opt, object, the maximum search results*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"captureNoList": {
/*ro, opt, object, collection No. list*/
"maxSize":  1,
/*ro, req, int, the maximum collection No.*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"employeeNoList": {
/*ro, opt, object, employee No. list*/
"maxSize":  1,
/*ro, req, int, the maximum employee No.*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"searchType": {
/*ro, opt, object, collection No.*/
## "@opt": ["new", "modified"]
/*ro, req, array, options, subType:string*/
## },
"DataCollections": {
/*ro, opt, object, list of matched records*/
"maxSize":  0,
/*ro, req, int, the maximum data number*/
"captureNo": {
/*ro, opt, object, collection No.*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
## "name": {
/*ro, opt, object, name*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"userType": {
/*ro, opt, object, person type, desc:"normal"-normal person (resident), "visitor"-visitor, "blacklist"-person in the blocklist. "patient",
"maintenance"-maintenance person, cleaner, etc.;*/
"@opt": ["normal", "visitor", "blackList", "maintenance"]
/*ro, req, array, person type, subType:string*/
## },
"employeeNo": {
/*ro, opt, object, employee No.*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"CardNoList": {
/*ro, opt, object, card No. list*/
"maxSize":  0,
/*ro, req, int, the maximum number of arrays*/
"cardNo": {
/*ro, opt, object, card No.*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"cardType": {
/*ro, opt, object, card type*/
"@opt": ["TypeA_M1", "TypeA_CPU", "TypeB", "ID_125K", "FelicaCard", "DesfireCard"]
/*ro, req, array, options, subType:string*/
## }
## },
"IDCardNo": {
/*ro, opt, object, ID card No.*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"Valid": {
/*ro, opt, object, parameters of the validity period*/
## "enable": {
/*ro, req, object, whether to enable validity period*/
"@opt": [true, false]
/*ro, req, array, "true"- enable, "false"-disable, subType:bool*/
## },
Hikvision co MMC
adil@hikvision.co.az

## },
"timeRangeBegin":  "1970-01-01T00:00:00",
/*ro, opt, string, start time that can be configured for beginTime, desc:if the device does not return this node, the default start time
that can be configured for beginTime is "1970-01-01T00:00:00"*/
"timeRangeEnd":  "2037-12-31T23:59:59",
/*ro, opt, string, end time that can be configured for endTime, desc:if the device does not return this node, the default start time
that can be configured for beginTime is "1970-01-01T00:00:00"*/
"timeType": {
/*ro, opt, object, time type*/
"@opt": ["local", "UTC"]
/*ro, req, array, options, subType:string*/
## }
## },
"FingerprintList": {
/*ro, opt, object, fingerprint list*/
"fingerprintID": {
/*ro, opt, object, fingerprint No.*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
## "fingerprint": {
/*ro, opt, object, fingerprint information*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## }
## },
"faceURL": {
/*ro, opt, object, Face picture URL*/
## "@min":  1,
/*ro, req, int, the minimum length*/
## "@max":  256
/*ro, req, int, the maximum length*/
## },
"infraredFaceURL": {
/*ro, opt, object*/
## "@min":  1,
/*ro, req, int*/
## "@max":  256
/*ro, req, int*/
## },
"FaceFeature": {
/*ro, opt, object, facial features*/
"isSupportFaceRegion":  true,
/*ro, opt, bool, whether it supports configuring areas for facial feature detection*/
"isSupportCommonPoint":  true
/*ro, opt, bool, whether it supports feature point coordinates*/
## },
"isSupportRiskMark":  true,
/*ro, opt, bool, whether it supports risk data mark*/
"dataType": {
/*ro, opt, object, data type*/
## "@opt": ["new", "modified", "normal"]
/*ro, req, array, options, subType:string*/
## },
"IdentityInfo": {
/*ro, opt, object, ID card information*/
"chnName": {
/*ro, opt, object, Chinese name*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"enName": {
/*ro, opt, object, English name*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
## "sex": {
/*ro, opt, object, gender*/
## "@opt": ["1", "2", "0"]
/*ro, req, array, options, subType:string*/
## },
## "birth": {
/*ro, opt, object, date of birth*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
## "addr": {
/*ro, opt, object, address*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"IDCardNo": {
/*ro, opt, object, ID card No.*/
Hikvision co MMC
adil@hikvision.co.az

/*ro, opt, object, ID card No.*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"issuingAuthority": {
/*ro, opt, object, issuing authority*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"startDate": {
/*ro, opt, object, start date of validity period*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"endDate": {
/*ro, opt, object, end date of validity period*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
## "nation": {
/*ro, opt, object, N/A*/
## "@min":  1,
/*ro, req, int, the minimum value, range:[1,56]*/
## "@max":  56
/*ro, req, int, the maximum value, range:[1,56]*/
## },
"passNo": {
/*ro, opt, object, entry-exit permit No.*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"issueNumber": {
/*ro, opt, object, issued times*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"certificateType": {
/*ro, opt, object, certificate type*/
## "@opt": ["1", "2", "3"]
/*ro, req, array, options, subType:string*/
## },
"permanentResidenceCardNo": {
/*ro, opt, object, permanent resident visa No.*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"nationalityOrAreaCode": {
/*ro, opt, object, country/region code*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
## "version": {
/*ro, opt, object, certificate version No.*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"receivingAuthorityCode": {
/*ro, opt, object, acceptance authority code*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
"FingerprintList": {
/*ro, opt, object, fingerprint information list*/
"maxSize":  0,
/*ro, req, int, the maximum number of arrays*/
## "fingerprint": {
/*ro, opt, object, fingerprint information*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## }
## },
## "pic": {
Hikvision co MMC
adil@hikvision.co.az

## "pic": {
/*ro, opt, object, certificate picture information*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## }
## },
"CardIssueStatus": {
/*ro, opt, object, issuing status list of cards containing face pictures and fingerprints*/
## "@size":  0,
/*ro, req, int, capability of number of elements in the array*/
## "face": {
/*ro, opt, object, issuing status of the card with face information*/
"@opt": [true, false]
/*ro, req, array, options, subType:bool*/
## },
## "fingprint1": {
/*ro, opt, object, issuing status of the card with fingerprint 1 information*/
"@opt": [true, false]
/*ro, req, array, options, subType:bool*/
## },
## "fingprint2": {
/*ro, opt, object, issuing status of the card with fingerprint 2 information*/
"@opt": [true, false]
/*ro, req, array, options, subType:bool*/
## }
## }
## }
## },
"RuleInfo": {
/*ro, opt, object, rule list*/
"reqAdminRights": [true, false],
/*ro, opt, array, whether the administrator permission is required, subType:bool*/
"enableCardNoLenAuto": [true, false],
/*ro, opt, array, whether to enable length self-adaption of the card serial No., subType:bool*/
"maxSize":  0,
/*ro, opt, int, the maximum number of rule list*/
"supportFunction": {
/*ro, opt, object, supported methods*/
## "@opt": ["put", "get", "delete", "post"]
/*ro, req, array, options, subType:string*/
## },
"dataType": {
/*ro, opt, object, data type*/
"@opt": ["name", "employeeNo", "IDCardNo", "IDCardSerialNo", "IDCardDetails", "card", "fingprint", "face"]
/*ro, req, array, options, subType:string*/
## },
"enable": [true, false],
/*ro, opt, array, whether to collect and display data, subType:bool*/
"uniqueCheck": [true, false],
/*ro, opt, array, whether to enable uniqueness verification, subType:bool*/
## "len": [
/*ro, opt, array, the capability list will be returned according to the data type, subType:object*/
## {
"dataType":  "name",
/*ro, req, enum, data type, subType:string, desc:data type*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## }
## ],
## "num": [
/*ro, opt, array, the capability list will be returned according to the data type, subType:object*/
## {
"dataType":  "card",
/*ro, req, enum, data type, subType:string, desc:data type*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## }
## ],
"fingerprintIDs": {
/*ro, opt, object, fingerprint No.*/
"maxSize":  0,
/*ro, req, int, the maximum value*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"enableLocalIssueCard": {
/*ro, opt, object, whether to enable issuing smart cards locally*/
"@opt": [true, false]
/*ro, req, array, options, subType:bool*/
## },
"isLocalStorage": {
/*ro, opt, object, whether to store face picture and fingerprint information in the device locally*/
"@opt": [true, false]
/*ro, req, array, options, subType:bool*/
## }
## },
Hikvision co MMC
adil@hikvision.co.az

"CaptureProgress": {
/*ro, opt, object, collection progress*/
"supportFunction": {
/*ro, opt, object, supported methods*/
## "@opt": ["put", "get", "delete", "post"]
/*ro, req, array, options, subType:string*/
## },
"reqCaptureNum": {
/*ro, opt, object, total number of persons to be collected*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"completelyCaptureNum": {
/*ro, opt, object, number of completely collected persons*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"partiallyCaptureNum": {
/*ro, opt, object, number of partially collected persons*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"reqFaceNum": {
/*ro, opt, object, number of faces to be collected*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"faceNum": {
/*ro, opt, object, number of collected faces*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"reqFingerprintNum": {
/*ro, opt, object, number of fingerprints to be collected*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"fingerprintNum": {
/*ro, opt, object, number of collected fingerprints*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"reqCardNum": {
/*ro, opt, object, number of cards to be collected*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"cardNum": {
/*ro, opt, object, number of collected cards*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"reqIDCardNum": {
/*ro, opt, object, number of ID cards to be collected*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"IDCardNum": {
/*ro, opt, object, number of collected ID cards*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"reqIssueNum": {
/*ro, opt, object, number of persons to be issued with smart cards*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## },
"IssuedNum": {
/*ro, opt, object, number of persons that have been issued with smart cards*/
## "@min":  0,
Hikvision co MMC
adil@hikvision.co.az

## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## }
## },
"DataOutput": {
/*ro, opt, object, data exporting*/
"supportFunction": {
/*ro, opt, object, supported methods*/
## "@opt": ["put", "get", "delete", "post"]
/*ro, req, array, options, subType:string*/
## },
## "password": {
/*ro, opt, object, password for data export*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## },
## "type": {
/*ro, opt, object, exporting method*/
"@opt":  "USB"
/*ro, req, string, options*/
## },
## "progress": {
/*ro, opt, object, exporting progress*/
## "@min":  0,
/*ro, req, int, the minimum value*/
## "@max":  0
/*ro, req, int, the maximum value*/
## }
## },
"UploadFailedDetails": {
/*ro, opt, object, failing details uploading*/
## "description": {
/*ro, opt, object, detailed description*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## }
## },
"DeleteDataCollections": {
/*ro, opt, object, offline collection deleting (by conditions)*/
"employeeNoList": {
/*ro, opt, object, employee No. list*/
"maxSize":  1,
/*ro, req, int, the maximum number of employee No.*/
## "@min":  0,
/*ro, req, int, the minimum length*/
## "@max":  0
/*ro, req, int, the maximum length*/
## }
## }
## }
## }
Request URL
DELETE /ISAPI/AccessControl/OfflineCapture/DataCollections/<captureNo>?format=json
## Query Parameter
Parameter NameParameter TypeDescription
captureNostringCollection No.
## Request Message
## None
## Response Message
7.3.4.2 Deleted a specific piece of offline collected data
Hikvision co MMC
adil@hikvision.co.az

## {
"statusCode":  1,
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
"statusString":  "OK",
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
"subStatusCode":  "ok",
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
"errorCode":  1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg":  "ok",
/*ro, opt, string, error information, desc:this field is required when statusCode is not 1*/
"MErrCode":  "0x00000000",
/*ro, opt, string*/
"MErrDevSelfEx":  "0x00000000"
/*ro, opt, string*/
## }
Request URL
POST /ISAPI/AccessControl/OfflineCapture/DataCollections/downloadTask?format=json
## Query Parameter
## None
## Request Message
## {
"DataCollectionsCond": {
/*req, object, export condition*/
## "id":  "test",
/*req, string, downloading ID*/
"dataType":  "binary"
/*req, enum, file data type, subType:string, desc:file data type*/
## }
## }
## Response Message
## {
"DataCollections": {
/*ro, req, object, offline data*/
"dataType":  "binary",
/*ro, req, enum, file data type, subType:string, desc:file data type*/
"fileUrl":  "test"
/*ro, opt, string, file URL, range:[1,256]*/
## }
## }
Request URL
POST /ISAPI/AccessControl/OfflineCapture/DataCollections/searchTask?format=json
## Query Parameter
## None
## Request Message
7.3.4.3 Download offline data
7.3.4.4 Search for the collected data
Hikvision co MMC
adil@hikvision.co.az

## {
"SearchTaskCond": {
/*req, object, search condition*/
"searchID":  "test",
/*req, string, search ID which is used to check whether the upper-layer clients are the same one, range:[1,32]*/
"searchResultPosition":  0,
/*req, int, result filter*/
"maxResults":  1,
/*req, int, result filter, range:[1,2000000000], step:1*/
"captureNoList": [1, 2],
/*opt, array, search condition, subType:int, desc:collection No. list. If the collection No. is not configured,it will search all data according to
searchResultPosition*/
"searchType":  "new",
/*opt, enum, search condition, subType:string, desc:"new"-search and only return newly added data, "modified"-search and only return edited data. By
default all data will be searched*/
"EmployeeNoList": [
/*opt, array, subType:object*/
## {
"employeeNo":  "test"
/*opt, string, employee ID, range:[1,32]*/
## }
## ]
## }
## }
## Response Message
## {
"SearchTaskResponse": {
/*ro, req, object*/
"searchID":  "test",
/*ro, req, string, search ID which is used to check whether the upper-layer clients are the same one, range:[1,32]*/
"responseStatusStrg":  "OK",
/*ro, opt, enum, status search, subType:string, desc:"OK" (searching completed), "MORE" (searching for more data), "NO MATCH" (no matched data).*/
"numOfMatches":  1,
/*ro, opt, int, number of results returned this time*/
"totalMatches":  1,
/*ro, opt, int, total number of matched results*/
"DataCollections": [
/*ro, opt, array, searched matched data information, subType:object*/
## {
"lastCaptureNo":  1,
/*ro, req, int, last collection No., range:[1,2000000000]*/
"captureNo":  1,
/*ro, req, int, current collection No., range:[1,2000000000]*/
## "name":  "test",
/*ro, opt, string, name*/
"userType":  "normal",
/*ro, opt, enum, subType:string*/
"employeeNo":  "test",
/*ro, opt, string, employee ID*/
"IDCardNo":  "test",
/*ro, opt, string, ID Card No.*/
"Valid": {
/*ro, opt, object*/
"enable":  true,
/*ro, req, bool*/
"beginTime":  "2017-08-01T17:30:08+08:00",
/*ro, req, datetime*/
"endTime":  "2017-08-01T17:30:08+08:00",
/*ro, req, datetime*/
"timeType":  "local"
/*ro, opt, enum, subType:string*/
## },
"CardNoList": [
/*ro, opt, array, card No. list, subType:object*/
## {
"cardNo":  "test",
/*ro, opt, string, card No., range:[1,32]*/
"cardType":  "TypeA_M1"
/*ro, opt, enum, card type, subType:string, desc:“TypeA_M1","TypeA_CPU","TypeB","ID_125K","FelicaCard","DesfireCard”*/
## }
## ],
"FingerprintList": [
/*ro, opt, array, fingerprint data list, subType:object*/
## {
"fingerprintID":  1,
/*ro, opt, int, fingerprint No.*/
## "fingerprint":  "test"
/*ro, opt, string, fingerprint information, desc:base64 decoding*/
## }
## ],
"faceURL":  "test",
/*ro, opt, string, face picture URL, range:[1,256]*/
"FaceFeature": {
/*ro, req, object, feature information of face picture matting*/
"Region": {
/*ro, req, object, area, desc:the origin is the upper-left corner of the screen*/
## "height":  0.120,
Hikvision co MMC
adil@hikvision.co.az

/*ro, req, float, height, range:[0.000,1.000]*/
## "width":  0.120,
/*ro, req, float, width, range:[0.000,1.000]*/
## "x":  0.120,
/*ro, req, float, X-coordinate of the upper-left corner, range:[0.000,1.000]*/
## "y":  0.120
/*ro, req, float, Y-coordinate of the upper-left corner, range:[0.000,1.000]*/
## },
"LeftEyePoint": {
/*ro, opt, object, coordinates of the left eye, desc:the origin is the upper-left corner of the screen*/
## "x":  0.120,
/*ro, req, float, X-coordinate, range:[0.000,1.000]*/
## "y":  0.120
/*ro, req, float, Y-coordinate, range:[0.000,1.000]*/
## },
"RightEyePoint": {
/*ro, opt, object, coordiantes of the right eye, desc:the origin is the upper-left corner of the screen*/
## "x":  0.120,
/*ro, req, float, X-coordinate, range:[0.000,1.000]*/
## "y":  0.120
/*ro, req, float, Y-coordinate, range:[0.000,1.000]*/
## },
"LeftMouthPoint": {
/*ro, opt, object, coordinates of the left mouth corner, desc:the origin is the upper-left corner of the screen*/
## "x":  0.120,
/*ro, req, float, X-coordinate, range:[0.000,1.000]*/
## "y":  0.120
/*ro, req, float, Y-coordinate, range:[0.000,1.000]*/
## },
"RightMouthPoint": {
/*ro, opt, object, coordinates of the right mouth corner, desc:the origin is the upper-left corner of the screen*/
## "x":  0.120,
/*ro, req, float, X-coordinate, range:[0.000,1.000]*/
## "y":  0.120
/*ro, req, float, Y-coordinate, range:[0.000,1.000]*/
## },
"NoseTipPoint": {
/*ro, opt, object, coordinates of the nose, desc:the origin is the upper-left corner of the screen*/
## "x":  0.120,
/*ro, req, float, X-coordinate, range:[0.000,1.000]*/
## "y":  0.120
/*ro, req, float, Y-coordinate, range:[0.000,1.000]*/
## }
## },
"riskDataMark":  true,
/*ro, opt, bool, whether to mark risk data: "true"-mark the data as the risk data and person and ID comparison failed,"false" or this field
is not returned-the data is normal*/
"dataType":  "new",
/*ro, opt, enum, data type and status:, subType:string, desc:"new"-newly added data, "modified"-edited data, "normal"-unchanged data*/
"IdentityInfo": {
/*ro, req, object, ID card information*/
"chnName":  "test",
/*ro, opt, string, Chinese name*/
"enName":  "test",
/*ro, opt, string, English name*/
## "sex":  "1",
/*ro, opt, enum, gender, subType:string, desc:“male”, “female”*/
## "birth":  "1990-02-24",
/*ro, opt, string, date of birth*/
## "addr":  "test",
/*ro, opt, string, address*/
"IDCardNo":  "test",
/*ro, opt, string, ID Number*/
"issuingAuthority":  "test",
/*ro, opt, string, issuing authority*/
"startDate":  "test",
/*ro, opt, string, start date of the effective period*/
"endDate":  "test",
/*ro, opt, string, end date of the effective period*/
## "nation":  1,
/*ro, opt, int, N/A*/
"passNo":  "test",
/*ro, opt, string, entry-exit permit No.*/
"issueNumber":  "test",
/*ro, opt, string, issued times*/
"certificateType":  "1",
/*ro, opt, enum, certificate type, subType:string*/
"permanentResidenceCardNo":  "test",
/*ro, opt, string, permanent resident visa No.*/
"nationalityOrAreaCode":  "test",
/*ro, opt, string, country/region code*/
## "version":  "test",
/*ro, opt, string, certificate version No.*/
"receivingAuthorityCode":  "test",
/*ro, opt, string, acceptance authority code*/
"FingerprintList": [
/*ro, opt, array, fingerprint information list, subType:object*/
## {
## "fingerprint":  "test"
/*ro, opt, string, fingerprint information, desc:base64 decoding*/
## }
## ],
## "pic":  "test"
/*ro, opt, string, certificate picture information,, desc:which should be encoded by Base64,encrypted and decrypted by a specific
Hikvision co MMC
adil@hikvision.co.az

/*ro, opt, string, certificate picture information,, desc:which should be encoded by Base64,encrypted and decrypted by a specific
decryption library*/
## },
"CardIssueStatus": [
/*ro, opt, array, issuing status list of cards containing face pictures and fingerprints, subType:object*/
## {
"cardNo":  "test",
/*ro, opt, string, card No.*/
"face":  true,
/*ro, opt, bool, face picture applying status*/
"fingprint1":  true,
/*ro, opt, bool, card issuing status of the fingerprint 1: true-with card issued,false-without card issued*/
"fingprint2":  true
/*ro, opt, bool, card issuing status of the fingerprint 2: true-with card issued,false-without card issued*/
## }
## ]
## }
## ]
## }
## }
Parameter NameParameter ValueParameter Type(Content-Type)Content-IDFile NameDescription
设备未实现[Message content]application/json------
FacePic[Binary picture data]image/jpeg设备未实现--
Note： The protocol is transmitted in form format. See Chapter 4.5.1.4 for form framework description, as shown in
the instance below.
## --<frontier>
Content-Disposition: form-data; name=Parameter Name;filename=File Name
Content-Type: Parameter Type
Content-Length: ****
Content-ID: Content ID
## Parameter Value
Request URL
DELETE /ISAPI/AccessControl/OfflineCapture/DataCollections?format=json
## Query Parameter
## None
## Request Message
## None
## Response Message
## {
"statusCode":  1,
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
"statusString":  "ok",
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
"subStatusCode":  "ok",
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
"errorCode":  1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg":  "ok"
/*ro, opt, string, error information, desc:this field is required when statusCode is not 1*/
## }
Parameter Name: the name property of Content-Disposition in the header of form unit; it refers to the form unit
name.
Parameter Type (Content-Type): the Content-Type property in the header of form unit.
File Name (filename): the filename property of Content-Disposition of form unit Headers. It exists only when the
transmitted data of form unit is file, and it refers to the file name of form unit body.
Parameter Value: the body content of form unit.
7.3.4.5 Delete all offline collected data
7.3.4.6 Get the progress of exporting the offline collected data
Hikvision co MMC
adil@hikvision.co.az

Request URL
GET /ISAPI/AccessControl/OfflineCapture/dataOutput/progress?format=json
## Query Parameter
## None
## Request Message
## None
## Response Message
## {
"DataOutputProgress": {
/*ro, req, object*/
## "progress":  1
/*ro, req, int, exporting progress, range:[1,100]*/
## }
## }
Request URL
PUT /ISAPI/AccessControl/OfflineCapture/dataOutput?format=json
## Query Parameter
## None
## Request Message
## {
"DataOutputCfg": {
/*req, object*/
## "password":  "test",
/*req, string, password for exporting*/
"type":  "UsbDisk"
/*opt, enum, exporting method, subType:string, desc:exporting method*/
## }
## }
## Response Message
## {
"statusCode":  1,
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
"statusString":  "OK",
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
"subStatusCode":  "ok",
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
"errorCode":  1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg":  "ok",
/*ro, opt, string, error details, desc:this node is required when the value of statusCode is not 1*/
"MErrCode":  "0x00000000",
/*ro, opt, string*/
"MErrDevSelfEx":  "0x00000000"
/*ro, opt, string*/
## }
Request URL
GET /ISAPI/AccessControl/OfflineCapture/InfoFile/progress?format=json
## Query Parameter
## None
## Request Message
## None
## Response Message
7.3.4.7 Export the offline collected data
7.3.4.8 Get the progress of uploading the user list of offline collection
Hikvision co MMC
adil@hikvision.co.az

## {
"InfoFileProgress": {
/*ro, req, object*/
## "percent":  100
/*ro, req, int, percentage of the uploading progress, range:[1,100]*/
## }
## }
Request URL
POST /ISAPI/AccessControl/OfflineCapture/InfoFile?format=json
## Query Parameter
## None
## Request Message
## {
"InfoFile": {
/*req, object*/
"dataType":  "binary",
/*req, enum, URL, subType:string, desc:URL*/
"fileUrl":  "test"
/*opt, string, this node is valid when the value of dataType is "url"*/
## }
## }
## Parameter
## Name
## Parameter
## Value
## Parameter
Type(Content-Type)
## Content-
## ID
File NameDescription
## 设备未解析，如
## 填写1
[Message
content]
application/json------
设备未实现[Stream data]application/octet-stream
## 设备未解析，文件真实名称
## （带后缀.xls）
## --
Note： The protocol is transmitted in form format. See Chapter 4.5.1.4 for form framework description, as shown in
the instance below.
## --<frontier>
Content-Disposition: form-data; name=Parameter Name;filename=File Name
Content-Type: Parameter Type
Content-Length: ****
Content-ID: Content ID
## Parameter Value
## Response Message
7.3.4.9 Upload the user list of offline collection
Parameter Name: the name property of Content-Disposition in the header of form unit; it refers to the form unit
name.
Parameter Type (Content-Type): the Content-Type property in the header of form unit.
File Name (filename): the filename property of Content-Disposition of form unit Headers. It exists only when the
transmitted data of form unit is file, and it refers to the file name of form unit body.
Parameter Value: the body content of form unit.
Hikvision co MMC
adil@hikvision.co.az

## {
"statusCode":  1,
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
"statusString":  "ok",
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
"subStatusCode":  "ok",
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
"errorCode":  1,
/*ro, opt, int, error code, desc:it is required when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg":  "ok"
/*ro, opt, string, error description, desc:this field is required when the value of statusCode is not 1*/
## }
Request URL
POST /ISAPI/AccessControl/OfflineCapture/InfoFileTemplateDownload?format=json
## Query Parameter
## None
## Request Message
## {
"InfoFileTemplateCond": {
/*req, object*/
"dataType":  "binary"
/*req, enum, URL, subType:string, desc:URL*/
## }
## }
## Response Message
## {
"InfoFileTemplate": {
/*ro, req, object, template file*/
"dataType":  "binary",
/*ro, req, enum, file data type, subType:string, desc:file data type*/
"fileUrl":  "test"
/*ro, opt, string, file URL, range:[1,256], desc:this field is valid when the value of dataType is "url”*/
## }
## }
## Parameter
## Name
## Parameter
## Value
Parameter Type(Content-
## Type)
## Content-
## ID
File NameDescription
## 设备未实现
[Message
content]
application/json------
dataCollections
[Binary picture
data]
image/jpeginfoFileTemplate.xls--
Note： The protocol is transmitted in form format. See Chapter 4.5.1.4 for form framework description, as shown in
the instance below.
## --<frontier>
Content-Disposition: form-data; name=Parameter Name;filename=File Name
Content-Type: Parameter Type
Content-Length: ****
Content-ID: Content ID
## Parameter Value
7.3.4.10 Download user list template of offline collection
Parameter Name: the name property of Content-Disposition in the header of form unit; it refers to the form unit
name.
Parameter Type (Content-Type): the Content-Type property in the header of form unit.
File Name (filename): the filename property of Content-Disposition of form unit Headers. It exists only when the
transmitted data of form unit is file, and it refers to the file name of form unit body.
Parameter Value: the body content of form unit.
Hikvision co MMC
adil@hikvision.co.az

Request URL
GET /ISAPI/AccessControl/OfflineCapture/progress?format=json
## Query Parameter
## None
## Request Message
## None
## Response Message
## {
"CaptureProgress": {
/*ro, req, object*/
"reqCaptureNum":  1,
/*ro, opt, int, total number of persons to be collected*/
"completelyCaptureNum":  1,
/*ro, opt, int, number of completely collected persons*/
"partiallyCaptureNum":  1,
/*ro, opt, int, number of partially collected persons*/
"reqFaceNum":  1,
/*ro, opt, int, number of faces to be collected*/
"faceNum":  1,
/*ro, opt, int, number of collected faces*/
"reqFingerprintNum":  1,
/*ro, opt, int, number of fingerprints to be collected*/
"fingerprintNum":  1,
/*ro, opt, int, number of collected fingerprints*/
"reqCardNum":  1,
/*ro, opt, int, number of cards to be collected*/
"cardNum":  1,
/*ro, opt, int, number of collected cards*/
"reqIDCardNum":  1,
/*ro, opt, int, number of ID cards to be collected*/
"IDCardNum":  1,
/*ro, opt, int, number of collected ID cards*/
"reqIssueNum":  1,
/*ro, opt, int, number of persons to be issued with smart cards*/
"IssuedNum":  1
/*ro, opt, int, number of persons that have been issued with smart cards*/
## }
## }
Request URL
PUT /ISAPI/AccessControl/OfflineCapture/ruleInfo?format=json
## Query Parameter
## None
## Request Message
7.3.4.11 Search for the offline collection progress
7.3.4.12 Set the parameters of offline collection rules
Hikvision co MMC
adil@hikvision.co.az

## {
"RuleInfo": {
/*req, object, rule information*/
"reqAdminRights":  true,
/*req, bool, whether the administrator permission is required, desc:whether the administrator permission is required*/
"enableCardNoLenAuto":  true,
/*opt, bool, whether to enable length self-adaption of the card serial No., desc:the priority of this node is higher than len*/
"RuleList": [
/*opt, array, rule list, subType:object, desc:it contains rules for collecting different types of data*/
## {
"dataType":  "name",
/*req, enum, data type, subType:string, desc:"name", "employeeNo" (employee No.), "IDCardNo" (ID card No.), "IDCardSerialNo" (ID card serial
No.), "IDCardDetails" (ID card details), "card", "fingprint" (fingerprint), "face"*/
"enable":  true,
/*req, bool, whether to collect and display*/
"uniqueCheck":  true,
/*opt, bool, whether to enable uniqueness verification; "false" (default), desc:this mode is valid when dataType is "name". For other data
types, this node is the read-only optional parameter*/
## "len":  128,
/*opt, int, data length, desc:this node is valid when dataType is "name", "enployeeNo" or "card". The default data length of name is 128.
For other data types, this node is the read-only optional parameter. If it is not supported, this node will not be returned*/
## "num":  2,
/*opt, int, number of collected data, desc:this node is valid when dataType is "fingerprint" or "card"*/
"fingerprintIDs": [1, 2]
/*opt, array, ID list of fingerprints that need to be collected, subType:int, desc:this node is valid when dataType is "fingerprint"*/
## }
## ],
"enableLocalIssueCard":  true,
/*opt, bool, whether to enable issuing smart cards locally, desc:whether to enable issuing smart cards locally*/
"isLocalStorage":  false
/*opt, bool, whether to store face picture and fingerprint information in the device locally, desc:whether to store face picture and fingerprint
information in the device locally*/
## }
## }
## Response Message
## {
"statusCode":  1,
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
"statusString":  "ok",
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
"subStatusCode":  "ok",
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
"errorCode":  1,
/*ro, opt, int, error code, desc:it is required when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg":  "ok"
/*ro, opt, string, error information, desc:this node is required when the value of statusCode is not 1*/
## }
Request URL
GET /ISAPI/AccessControl/OfflineCapture/ruleInfo?format=json
## Query Parameter
## None
## Request Message
## None
## Response Message
7.3.4.13 Get the parameters of offline collection rules
Hikvision co MMC
adil@hikvision.co.az

## {
"RuleInfo": {
/*ro, req, object, rule information*/
"reqAdminRights":  true,
/*ro, req, bool, whether the administrator permission is required, desc:whether the administrator permission is required: "true"-yes,"false"-no*/
"enableCardNoLenAuto":  true,
/*ro, opt, bool, whether to enable length self-adaption of the card serial No. The priority of this field is higher than len, desc:whether to enable
length self-adaption of the card serial No. The priority of this field is higher than len*/
"RuleList": [
/*ro, opt, array, rule list, subType:object, desc:this node contains rules for collecting different types of data*/
## {
"dataType":  "name",
/*ro, req, enum, data type, subType:string, desc:"name", "employeeNo" (employee No.), "IDCardNo" (ID card No.), "IDCardSerialNo" (ID card
serial No.), "IDCardDetails" (ID card details), "card", "fingprint" (fingerprint), "face"*/
"enable":  true,
/*ro, req, bool, whether to collect and display*/
"uniqueCheck":  true,
/*ro, opt, bool, whether to enable uniqueness verification, desc:this field is valid when dataType is "name". For other data types, this
field is the read-only optional parameter*/
## "len":  128,
/*ro, opt, int, data length, desc:this field is valid when dataType is "name", "enployeeNo" or "card". The default data length of name is
- For other data types, this field is the read-only optional parameter. If it is not supported, this field will not be returned*/
## "num":  2,
/*ro, opt, int, number of collected data, desc:this field is valid when dataType is "fingerprint" or "card"*/
"fingerprintIDs": [1, 2]
/*ro, opt, array, ID list of fingerprints that need to be collected, subType:int, desc:this field is valid when dataType is "fingerprint"*/
## }
## ],
"enableLocalIssueCard":  true,
/*ro, opt, bool, whether to enable issuing smart cards locally, desc:whether to enable issuing smart cards locally*/
"isLocalStorage":  false
/*ro, opt, bool, whether to store face picture and fingerprint information in the device locally, desc:whether to store face picture and fingerprint
information in the device locally*/
## }
## }
Request URL
GET /ISAPI/AccessControl/OfflineCapture/uploadFailedDetails?format=json
## Query Parameter
## None
## Request Message
## None
## Response Message
## {
"UploadFailedDetails ": {
/*ro, req, object*/
## "description":  "test"
/*ro, req, string, detailed descriptions of failed uploading*/
## }
## }
If you need access to corresponding video guidance for device integration, please register on https://tpp.hikvision.com
and visit our Training Center: https://tpp.hikvision.com/tpp/Training. The Training Center is specifically designed to
provide technical training and guidance resources for our partners. On this platform, you can find integration video
tutorials for various devices, enabling better understanding and learning of the integration process. To offer more
personalized service, our Training Center also supports filtering by integration protocols, devices, and applications.
7.3.4.14 Get the details of failing to upload the files with offline collection user list
8 How-To Video Guidance
Hikvision co MMC
adil@hikvision.co.az