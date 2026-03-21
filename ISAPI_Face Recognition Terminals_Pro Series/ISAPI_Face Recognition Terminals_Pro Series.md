# Hikvision co MMC
adil@hikvision.co.az
About this Document
Trademarks Acknowledgment
All trademarks and logos mentioned are the properties of their respective owners.
LEGAL DISCLAIMER
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
```
LOSS OF DOCUMENTATION, WHETHER BASED ON BREACH OF CONTRACT, TORT (INCLUDING NEGLIGENCE),
```
PRODUCT LIABILITY, OR OTHERWISE, IN CONNECTION WITH THE USE OF THE PRODUCT, EVEN IF OUR
COMPANY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES OR LOSS.
YOU ACKNOWLEDGE THAT THE NATURE OF THE INTERNET PROVIDES FOR INHERENT SECURITY RISKS, AND
OUR COMPANY SHALL NOT TAKE ANY RESPONSIBILITIES FOR ABNORMAL OPERATION, PRIVACY LEAKAGE OR
OTHER DAMAGES RESULTING FROM CYBER-ATTACK, HACKER ATTACK, VIRUS INFECTION, OR OTHER INTERNET
```
SECURITY RISKS; HOWEVER, OUR COMPANY WILL PROVIDE TIMELY TECHNICAL SUPPORT IF REQUIRED.
```
YOU AGREE TO USE THIS PRODUCT IN COMPLIANCE WITH ALL APPLICABLE LAWS, AND YOU ARE SOLELY
RESPONSIBLE FOR ENSURING THAT YOUR USE CONFORMS TO THE APPLICABLE LAW. ESPECIALLY, YOU ARE
RESPONSIBLE, FOR USING THIS PRODUCT IN A MANNER THAT DOES NOT INFRINGE ON THE RIGHTS OF THIRD
PARTIES, INCLUDING WITHOUT LIMITATION, RIGHTS OF PUBLICITY, INTELLECTUAL PROPERTY RIGHTS, OR DATA
PROTECTION AND OTHER PRIVACY RIGHTS. YOU SHALL NOT USE THIS PRODUCT FOR ANY PROHIBITED END-
USES, INCLUDING THE DEVELOPMENT OR PRODUCTION OF WEAPONS OF MASS DESTRUCTION, THE
DEVELOPMENT OR PRODUCTION OF CHEMICAL OR BIOLOGICAL WEAPONS, ANY ACTIVITIES IN THE CONTEXT
RELATED TO ANY NUCLEAR EXPLOSIVE OR UNSAFE NUCLEAR FUEL-CYCLE, OR IN SUPPORT OF HUMAN RIGHTS
ABUSES.
IN THE EVENT OF ANY CONFLICTS BETWEEN THIS DOCUMENT AND THE APPLICABLE LAW, THE LATTER
PREVAILS.
Hikvision co MMC
adil@hikvision.co.az
Chapter Description
Overview Includes the ISAPI overview, applicable products, terms and definitions, abbreviations, and updatehistory.
ISAPI
Framework Read the chapter to take a quick look at the ISAPI framework and basic functions.
Quick Start
Guide
Read the chapter to quickly understand the programming process of basic functions such as
authentication, message parsing, real-time live view, playback, and event uploading.
API
Reference Start programming according to API definitions.
How-To
Video
Guidance
How-to videos demonstrate detailed steps of different integration tasks.
```
Intelligent Security API (hereinafter referred to as ISAPI) is an application layer protocol based on HTTP (Hypertext
```
```
Transfer Protocol) and adopts the REST (Representational State Transfer) architecture for communication between
```
```
security devices (cameras, DVRs, NVRs, etc.) and the platform or client software.
```
Since established in 2013, ISAPI has included more than 11,000 APIs for different functions, including device
management, vehicle recognition, parking lot management, intelligent facial application, access control management,
interrogation management, and recording management. It is applicable to industries such as traffic, fire protection,
education, and security inspection.
When you integrate devices via ISAPI, the device acts as the server to listen on the fixed port and the user's application
acts as the client to actively log in to the device for communication. To achieve the above goals, the device should be
configured with a fixed IP address and the requests from the client can reach the server.
1 Reading Guide
2 Overview
2.1 Introduction
2.1.1 Application Scenario
Hikvision co MMC
adil@hikvision.co.az
ISAPI is an application layer protocol based on HTTP, thereby it inherits all specifications and properties from HTTP.
```
Protocols frequently used along with ISAPI include SADP (Search Active Device Protocol) based on multicast for
```
```
discovering and activating devices, RTSP (Real-Time Streaming Protocol) based on TCP/UDP for live view and video
```
playback of devices, etc.
It refers to the information uploaded by the device. The event is uploaded by the device in real time for the immediate
response from the client or the platform. If the device is offline, the event will be stored in the cache first and then it will
be uploaded again when the connection is restored.
Arming means that the client establishes connection with the device so that events can be uploaded to the client via the
connection. The client can subscribe to some event types, and the device will upload the specified events only,
otherwise the device will upload all types of events to the client.
After the platform starts listening service, when an event occurs, the event information will be sent to the listening port
of the platform based on the IP address and port No., then the connection will be closed.
The listening host service can be enabled to receive the event information from devices.
2.1.2 Layers in the Network Model
2.2 Product Scope
Face Recognition Terminals
Pro Series
DS-K1T605, DS-K1T606, DS-K1T607, DS-K1T607E, DS-K1T607EF, DS-K1T607M, DS-K1T607MF, DS-
K1T607MFW, DS-K1T607MW, DS-K1T640, DS-K1T642, DS-K1T642E, DS-K1T642EF, DS-K1T642EFW, DS-
K1T642EW, DS-K1T642M, DS-K1T642MF, DS-K1T642MFW, DS-K1T642MW, DS-K1T643MWX-T, DS-
K1T643MX-T, DS-K1T670MFWX, DS-K1T670MWX-QR, DS-K1T670MWX-WBQR, DS-K1T670MWX-WEQR, DS-
K1T670MX, DS-K1T670MX-QR, DS-K1T670MX-WB, DS-K1T670MX-WE, DS-K1T671, DS-K1T671AM, DS-
K1T671BM, DS-K1T671BMF, DS-K1T671BMFW, DS-K1T671BMW, DS-K1T671M, DS-K1T671MF, DS-
K1T673DBWFX, DS-K1T673DBWFX-QR, DS-K1T673DG1X-E1, DS-K1T673DGX, DS-K1T673DGX-E1, DS-
K1T673DWX, DS-K1T673DWX-E1, DS-K1T673DWX-PRO, DS-K1T673DWX-PROE1, DS-K1T673DX, DS-
K1T673DX-E1, DS-K1T6Q-F71M, DS-K1T6QT-F70MFWX, DS-K1T6QT-F70MFX, DS-K1T6QT-F70MWX, DS-
K1T6QT-F70MX, DS-K1T6QT-F72DWX, DS-K1T6QT-F72DX, DS-K1T8105, DS-K1TA70MI-T
2.3 Terms And Definitions
2.3.3 Event
2.3.2 Arming
2.3.4 Listen
2.3.5 Listening Host
Hikvision co MMC
adil@hikvision.co.az
The person ID is the unique identifier for person management, and the card, fingerprint, face picture are the person’s
credentials which are linked via the person ID. Permissions are also linked via the person ID.
Users can set the access permission that which person can open which doors at what time.
Credentials are the data which are used for recognizing specific persons. Cards, fingerprints, and face pictures can be
the credentials and linked to the specified persons. When the device detects the credential, it can recognize the person
whom the credential links to via the comparison algorithm.
Persons can be divided into normal persons, visitors, and blocklist persons according to different areas. In the access
control system, normal persons have permanent permissions to access the specified areas, visitors have temporary
permissions to access the specified areas, and blocklist persons do not have the permissions to access the specified
areas.
A group of persons which is used in multi-factor authentication. The same person can belong to different groups at the
same time. Up to 4 groups can be added at the same time.
Persons in the group can only open the door by the configured authentication rule, such as swiping card, authenticated
by fingerprint, face picture, or iris.
Generally refers to the private SIP number of devices in the building industry. It is an 11-digit number composed of the
phase number, building number, unit number, floor number, serial number, and community No. It is a unique ID for
devices during call intercom via the private SIP protocol.
```
For further expansions and differences in device number rules across various industries (such as health care and
```
```
prisons), the new device number is a 16-digit number composed of four factors: industry, device type, version, and
```
original device number. The format is: industry # device type # version # device number.
```
ISAPI: Intelligent Security API.
```
```
ISUP: Intelligent Security Uplink Protocol.
```
```
HTTP: Hypertext Transfer Protocol
```
```
FDLib: Face Picture Library
```
```
FDID: Face Picture Library ID
```
```
PID: Face Picture ID in the Face Picture Library
```
```
ACS: Access Control System. The access control system controls the entrance and exit channels. The system consists of
```
card readers, access controllers, electric locks, exit buttons, cards, application software, etc.
No update record
2.3.16 Person-Based Access Control
2.3.17 Access Permission
2.3.10 Credential Type
2.3.11 Person Type
2.3.12 Group
2.3.13 Multi-Factor Authentication
2.3.18 Device Number
2.3.19 New Device Number
2.4 Symbols And Acronyms
2.5 Update History
Hikvision co MMC
adil@hikvision.co.az
```
Notes:
```
In general, ISAPI refers to the communication protocol based on the HTTP standard. As ISAPI is usually used along with
```
RTSP (Real-Time Streaming Protocol), the RTSP standard is brought into the ISAPI system.
```
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
3.1 Overview
3.2 Activation
Hikvision co MMC
adil@hikvision.co.az
Firstly, two operations are defined:
```
bytesToHexstring: it is used to convert a byte array (the length is N) to a hexadecimal string (the length is 2N). For
```
example, 127,10,23 -> 7f0a17
```
hexStringToBytes: it is used to convert a hexadecimal string (the length is 2N) to a byte array (the length is N). For
```
example, 7f0a17 -> 127,10,23
1. The client generates a public and private key pair (1024 bits), and gets the 128-byte modulus in the public key
```
(hereinafter referred to as public key modulus). If the length is longer than 128, the leading 0 needs to be removed.
```
2. The client converts the public key modulus to a 256-byte public key string via bytesToHexstring and sends the
```
public key string to the device in XML message (related URI: POST /ISAPI/Security/challenge) after being
```
encoded by Base64.
3. The device parses the request to obtain a 256-byte public key string decoded by Base64 and converts it to a 128-
byte public key modulus via hexStringToBytes. The complete public key is the combination of obtained public key
```
modulus and public exponent (the default value is '010001').
```
4. The device generates a 32-byte hexadecimal random string, calls the RSA API to encrypt the random string with
the private key, converts the encrypted data to a string via bytesToHexstring, encodes the string by Base64, and
then sends it to the client.
5. The client decodes the string from the device by Base64, converts it via hexStringToBytes to get the encrypted data,
decrypts the encrypted data with the private key via RSA to obtain a 32-byte hexadecimal random string, converts
the obtained string via hexStringToBytes to get a 16-byte AES key. Then the client uses the AES key to encrypt the
"string consisting of the first 16 characters of the random string and the real password" by AES128
```
ECB mode (with zero-padding method) to get a ciphertext, and converts the ciphertext via bytesToHexstring,
```
```
encodes it by Base64, and sends it to the device in XML message (related URI: PUT /ISAPI/System/activate).
```
```
Note: If the first 16 characters of the random string are aaaabbbbccccdddd and the real password is Abc12345, the
```
data before encryption is aaaabbbbccccddddAbc12345. This can ensure that the client uses the random string as the
key for encryption.
6. The device decodes the string by Base64, converts it via hexStringToBytes to get the ciphertext, uses the AES key to
decrypt the ciphertext by AES128 ECB mode, and gets the real password via removing the first 16 characters.
Hikvision co MMC
adil@hikvision.co.az
```
Notes:
```
```
When the client applications send requests to devices, they need to use digest authentication (see details in RFC 7616)
```
for identity authentication.
Currently, all mainstream request class libraries of HTTP have encapsulated digest authentication. See details in
Authentication of Quick Start Guide.
There are three kinds of users with different permissions for access control and management.
```
Administrator: Has the permission to access all supported resources and should keep activated all the time. It is also
```
known as "admin".
```
Operator: Has the permission to access general resources and a part of advanced resources.
```
Normal User: Only has the permission to access general resources.
During ISAPI integration, the HTTPS service of devices is enabled by default. When the client applications communicate
with devices via HTTPS, the information can be transmitted securely.
ISAPI supports getting and setting stream media parameters of the device, such as video resolution, encoding format,
and stream.
```
Cameras support standard RTSP (Real-Time Streaming Protocol, see details in RFC 7826). Client applications can get
```
the stream from devices via RTSP.
For details about real-time streaming and video playback, refer to Real-Time Live View and Playback in Quick Start
Guide.
The metadata is the structured intelligent information generated by intelligent devices. When the client applications get
the audio and/or video stream from devices via RTSP, the metadata will be returned by the device at the same time. For
example, to display the face target frame, face information, vehicle target frame, license plate number, vehicle
information, and other information on the video stream, the client applications can overlay the above information on
the video image.
Before using the metadata, you need to enable the metadata function of the device and then get the stream from the
device via RTSP. Some devices support subscribing to the metadata by type. For details about the process of integrating
the metadata function, refer to Metadata Management.
7. The device verifies the password and returns the activation result.
You can get the device's activation status by calling the URI GET /SDK/activateStatus which requires no
authentication.
```
Devices also support to be activated via SADP (Search Active Device Protocol) which is based on the
```
communication protocol of the data link layer. With SADP, you do not have to know the IP address of the device
but need to ensure that the device and the application running SADP are connected to the same router. SADP also
supports discovering devices in the LAN, changing the password of the devices, and so on. The HCSadpSDK is
provided for SADP integration, including the developer guide, plug-in, and sample demo which can be used as a
simple SADP tool.
3.3 Security Mechanism
3.3.1 Authentication
3.3.2 User Permission
3.3.3 Information Encryption
3.4 Video Streaming
3.4.1 Audio and Video Stream
3.4.2 Metadata
Hikvision co MMC
adil@hikvision.co.az
```
When the client applications send requests to the devices, they need to use digest authentication (see details in RFC
```
```
7616) for identity authentication.
```
Client applications only need to call APIs of the class library to implement the digest authentication. The sample code is
shown below.
// #include <curl/curl.h>
// Callback Function
```
static size_t OnWriteData(void* buffer, size_t size, size_t nmemb, void* lpVoid)
```
```
{
```
```
std::string* str = dynamic_cast<std::string*>((std::string *)lpVoid);
```
```
if( NULL == str || NULL == buffer )
```
```
{
```
```
return -1;
```
```
}
```
```
char* pData = (char*)buffer;
```
```
str->append(pData, size * nmemb);
```
```
return nmemb;
```
```
}
```
```
std::string strUrl = "http://192.168.18.84:80/ISAPI/System/deviceInfo";
```
```
std::string strResponseData;
```
```
CURL *pCurlHandle = curl_easy_init();
```
```
curl_easy_setopt(pCurlHandle, CURLOPT_CUSTOMREQUEST, "GET");
```
```
curl_easy_setopt(pCurlHandle, CURLOPT_URL, strUrl.c_str());
```
// Set the user name and password
```
curl_easy_setopt(pCurlHandle, CURLOPT_USERPWD, "admin:admin12345");
```
// Set the authentication method to the digest authentication
```
curl_easy_setopt(pCurlHandle, CURLOPT_HTTPAUTH, CURLAUTH_DIGEST);
```
// Set the callback function
```
curl_easy_setopt(pCurlHandle, CURLOPT_WRITEFUNCTION, OnWriteData);
```
// Set the parameters of the callback function to get the returned information
```
curl_easy_setopt(pCurlHandle, CURLOPT_WRITEDATA, &strResponseData);
```
// Timeout settings for receiving the data. If receiving data is not completed within 5 seconds, the application will exit directly
```
curl_easy_setopt(pCurlHandle, CURLOPT_TIMEOUT, 5);
```
// Set the redirection times to avoid too many redirections
```
curl_easy_setopt(pCurlHandle, CURLOPT_MAXREDIRS, 1);
```
// Connection timeout duration. If the duration is too short, the client application will be disconnected before the data request sent by the application
reaches the device
```
curl_easy_setopt(pCurlHandle, CURLOPT_CONNECTTIMEOUT, 5);
```
```
CURLcode nRet = curl_easy_perform(pCurlHandle);
```
```
if (0 == nRet)
```
```
{
```
// Output the received message
```
std::cout << strResponseData << std::endl;
```
```
}
```
```
curl_easy_cleanup(pCurlHandle);
```
```
// using System.Net;
```
```
// using System.Net.Security;
```
try
```
{
```
```
string strUrl = "http://192.168.18.84:80/ISAPI/System/deviceInfo";
```
```
WebClient client = new WebClient();
```
// Set the user name and password
```
client.Credentials = new NetworkCredential("admin", "admin12345");
```
```
byte[] responseData = client.DownloadData(strUrl);
```
```
string strResponseData = Encoding.UTF8.GetString(responseData);
```
// Output received information
```
Console.WriteLine(strResponseData);
```
```
}
```
```
catch (Exception ex)
```
```
{
```
```
Console.WriteLine(ex.Message);
```
```
}
```
4 Quick Start Guide
4.1 Authentication
```
4.1.1 C/C++ (libcurl)
```
```
4.1.2 C# (WebClient)
```
```
4.1.3 Java (HttpClient)
```
Hikvision co MMC
adil@hikvision.co.az
```
// import org.apache.commons.httpclient.HttpClient;
```
```
String url = "http://192.168.18.84:80/ISAPI/System/deviceInfo";
```
```
HttpClient client = new HttpClient();
```
// Set the user name and password
```
UsernamePasswordCredentials creds = new UsernamePasswordCredentials("admin", "admin12345");
```
```
client.getState().setCredentials(AuthScope.ANY, creds);
```
```
GetMethod method = new GetMethod(url);
```
```
method.setDoAuthentication(true);
```
```
int statusCode = client.executeMethod(method);
```
```
byte[] responseData = method.getResponseBodyAsString().getBytes(method.getResponseCharSet());
```
```
String strResponseData = new String(responseData, "utf-8");
```
```
method.releaseConnection();
```
// Output received information
```
System.out.println(strResponseData);
```
# - *- coding: utf-8 -*-
import requests
```
request_url = 'http://192.168.18.84:80/ISAPI/System/deviceInfo'
```
# Set the authentication information
```
auth = requests.auth.HTTPDigestAuth('admin', 'admin12345')
```
# Send the request and receive response
```
response = requests.get(request_url, auth=auth)
```
# Output response content
```
print(response.text)
```
During the process of communication and interaction via ISAPI, the request and response messages are often text data
in XML or JSON format. Besides that, the data of firmware packages and configuration files is in binary format. A
```
request can also be in form format with multiple formats of data (multipart/form-data).
```
```
Generally, the Content-Type in the headers of the HTTP request is application/xml; charset="UTF-8".
```
Request and response messages in XML format are all encoded with UTF-8 standards in ISAPI.
The namespace http://www.isapi.org/ver20/XMLSchema and ISAPI version number 2.0 of XML messages are
configured by default, see the example below.
<?xml version="1.0" encoding="UTF-8"?>
<NodeList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<Node>
<id>1</id>
<enabled>true</enabled>
<nodeName>nodeName</nodeName>
<level>level1</level>
</Node>
</NodeList>
The Content-Type in the headers of the HTTP request is often application/json.
To distinguish between APIs with XML messages and those with JSON messages, ISAPI adds the query parameter
```
format=json to all request URLs with JSON messages, e.g.,
```
```
http://192.168.1.1:80/ISAPI/System/Sensor/thermometrySensor?format=json . Messages of request URLs without
```
the query parameter format=json are usually in XML format. However, there may be some exceptions, and the message
format is subject to the API definition.
Request and response messages in JSON format are all encoded by UTF-8 in ISAPI.
```
4.1.4 Python (requests)
```
4.2 Message Parsing
4.2.1 Message Format
4.2.1.1 XML
4.2.1.2 JSON
4.2.1.3 Binary Data
Hikvision co MMC
adil@hikvision.co.az
For the firmware and configuration files, the Content-Type in the header of an HTTP request is often
application/octet-stream.
```
When multiple pieces of data are submitted at the same time in an ISAPI request (e.g., the person information and face
```
```
picture need to be submitted at the same time when a face record is added to the face picture library), the Content-
```
Type in the header of the corresponding HTTP request is usually multipart/form-data, boundary=AaB03x, where the
boundary is a variable used to separate the entire HTTP body into multiple units and each unit is a piece of data with its
own headers and body. In Content-Disposition of form unit headers, the name property refers to the form unit name,
```
which is required for all form units; the filename property refers to the file name of form unit body, which is required
```
only when the form unit body is a file. In headers of form units, Content-Length refers to the body length, which starts
```
after CRLF(\r\n) and ends before two hyphens (--) of next form. There should be a CRLF used as the delimiter of two
```
```
form units before two hyphens (--), and the Content-Length of previous form unit does not include the CRLF length.
```
```
For the detailed format description, refer to RFC 1867 (Form-Based File Upload in HTML). Pay attention to two hyphens
```
```
(--) before and after the boundary.
```
Notes
The example of ISAPI form data submitted by a client to a device is as follows.
POST /ISAPI/Intelligent/FDLib/pictureUpload
```
Content-Type: multipart/form-data; boundary=e5c2f8c5461142aea117791dade6414d
```
Content-Length: 56789
--e5c2f8c5461142aea117791dade6414d
```
Content-Disposition: form-data; name="PictureUploadData";
```
Content-Type: application/xml
Content-Length: 1234
<PictureUploadData/>
--e5c2f8c5461142aea117791dade6414d
```
Content-Disposition: form-data; name="face_picture"; filename="face_picture.jpg";
```
Content-Type: image/jpeg
Content-Length: 34567
Picture Data
--e5c2f8c5461142aea117791dade6414d--
The example of ISAPI form data responded from a device to a client is as follows.
```
In ISAPI messages, when there are multiple form units, three nodes (pid, contentid, and filename) are used for linking
```
form units. The corresponding relations are as follows:
Node
Name
Form
Field Description
pid name pid in XML/JSON messages corresponds to the name property of Content-Disposition inform headers.
contentid Content-ID contentid in XML/JSON messages corresponds to Content-ID in form headers.
filename filename filename in XML/JSON messages corresponds to filename property of Content-Disposition inform headers.
```
4.2.1.4 Form (multipart/form-data)
```
In RFC specifications, it is strongly recommended to contain the field Content-Length in the entity header, and
there is no requirement that the field Content-Length should be contained in the header of each form element.
The absence of field Content-Length in the header should be considered when the client and device programs
parse the form data.
To avoid the conflict between message content and boundary value, it is recommended to use a longer and more
complex string as the boundary value.
Hikvision co MMC
adil@hikvision.co.az
HTTP/1.1 200 OK
```
Content-Type: multipart/form-data; boundary=136a73438ecc4618834b999409d05bb9
```
Content-Length: 56789
--136a73438ecc4618834b999409d05bb9
```
Content-Disposition: form-data; name="mixedTargetDetection";
```
Content-Type: application/json
Content-Length: 811
```
{
```
"ipAddress": "172.6.64.7",
"macAddress": "01:17:24:45:D9:F4",
"channelID": 1,
"dateTime": "2009-11-14T15:27+08:00",
"eventType": "mixedTargetDetection",
"eventDescription": "Mixed target detection",
"deviceID": "123456789",
```
"CaptureResult": [{
```
"targetID": 1,
```
"Human": {
```
```
"Rect": {
```
"height": 1.0,
"width": 1.0,
"x": 0.0,
"y": 0.0
```
},
```
"contentID1": "humanImage", /*human body thumbnail*/
"contentID2": "humanBackgroundImage", /*human body background picture*/
"pId1": "9d48a26f7b8b4f2390c16808f93f3534", /*human body thumbnail ID */
"pId2": "5EE7078E07BB47CF860DE8E4E9A85F28" /*ID of human body background picture*/
```
}
```
```
}]
```
```
}
```
--136a73438ecc4618834b999409d05bb9
```
Content-Disposition: form-data; name="9d48a26f7b8b4f2390c16808f93f3534"; filename="humanImage.jpg";
```
Content-Type: image/jpeg
Content-Length: 34567
Content-ID: humanImage
Picture Data
--136a73438ecc4618834b999409d05bb9
```
Content-Disposition: form-data; name="5EE7078E07BB47CF860DE8E4E9A85F28"; filename="humanBackgroundImage.jpg";
```
Content-Type: image/jpeg
Content-Length: 345678
Content-ID: humanBackgroundImage
Picture Data
--136a73438ecc4618834b999409d05bb9--
The field descriptions of ISAPI request and response messages are marked as annotations in the example messages as
shown below.
<?xml version="1.0" encoding="UTF-8"?>
<NodeList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, node list, attr:version{req, string, version No., range:[,]}-->
```
<Node>
<!--ro, opt, object, node information-->
<id>
<!--ro, req, int, node No., range:[,], step:, unit:, unitType:-->1
</id>
<enabled>
<!--ro, opt, bool, whether to enable-->true
</enabled>
<nodeName>
<!--ro, req, string, node name, range:[1,32]-->test
</nodeName>
<level>
<!--ro, opt, enum, level, subType:string,
[level1#level 1,level2#level 2,level3#level 3]-->level1
</level>
</Node>
</NodeList>
4.2.2 Annotation
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"name": "test",
/*ro, req, string, name, range:[1,32]*/
"type": "type1",
/*ro, req, enum, type, subType:string, [type1#type 1,type2#type 2]*/
"enabled": true,
/*ro, opt, bool, enable or not, desc:xxxxxxx*/
```
"NodeList": {
```
```
/*opt, object, node list, dep:and,{$.enabled,eq,true}*/
```
"scene": 1,
```
/*req, enum, scene, subType:int, [1#scene 1; 2#scene 2; 3#scene 3]*/
```
"ID": 1
/*req, int, No., range:[1,8], step:, unit:, unitType:*/
```
}
```
```
}
```
Key annotations are shown in the table below.
Annotation Description Remark
ro Attribute: Read-Only This field can only be obtained and cannot be edited.
wo Attribute: Write-Only This field can only be edited and cannot be obtained.
req Attribute:RequiredThis field is required for request messages sent to the device and responsemessages returned from the device.
opt Attribute:OptionalThis field is optional for request messages sent to the device and responsemessages returned from the device.
dep Attribute:Dependent This field is valid and required when specific conditions are satisfied.
object Field Type: Object The field of type object contains multiple sub-fields.
list Field Type: List The subType following it refers to the data type of sub-items in the list.
subType Field Type: String The range following it refers to the maximum and the minimum string size of thefield.
int Field Type: Int The range following it refers to the maximum and the minimum value of the field.
float Field Type: Float The range following it refers to the maximum and the minimum value of the field.
bool Field Type:Boolean The value can be true or false.
enum Field Type:EnumerationThe subType following it indicates that the enumerators are of type string or int.The [] following the subType contains all enumerators.
subType Sub-Type of Field When the type of field is list or enum, the value of subType is the data type of eachsub-object.
desc Field Description The detailed description of the field.
ISAPI has designed capability sets for almost all functions, APIs, and fields. URLs for getting the capability set end with
/capabilities. Some URLs may contain query parameters in the format: /capabilities?format=json&type=xxx.
There are two types of fields in the capability message of ISAPI: whether the device supports a function and the value
range of a field in an API.
Whether the device supports a function: it is often in the format isSupportXxxxxxxx, which indicates that whether
the device supports a function and a set of APIs for implementing this function.
The capability message example in JSON format is shown below:
4.2.3 Capability Set
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"isSupportMap": true,
/*ro, opt, bool, whether it supports the e-map function, desc:/ISAPI/SDT/Management/map/capabilities?format=json*/
"isSupportAlgTrainResourceInfo": true,
/*ro, opt, bool, whether it supports only getting the resource information of the algorithm training platform,
```
desc:/ISAPI/SDT/algorithmTraining/ResourceInfo?format=json*/
```
"isSupportAlgTrainAuthInfo": true,
/*ro, opt, bool, whether it supports ony getting the authorization information of the algorithm training platform,
```
desc:/ISAPI/SDT/algorithmTraining/SoftLock/AuthInfo?format=json*/
```
"isSupportAlgTrainNodeList": true,
/*ro, opt, bool, whether it supports only getting the node information of the algorithm training platform, desc:/ISAPI/SDT/algorithmTraining/NodeList?
```
format=json*/
```
"isSupportNAS": true
/*ro, opt, bool, whether it supports mounting and unmounting NAS, desc:/ISAPI/SDT/Management/NAS/capabilities?format=json*/
```
}
```
The capability message example in XML format is shown below:
<isSupportNetworkStatus>
```
<!--ro, opt, bool, whether it supports searching the network status, desc: related API (/ISAPI/System/Network/status?format=json)-->true
```
</isSupportNetworkStatus>
The value range of the field: the maximum value, minimum value, the maximum size, the minimum size, options,
and so on of each field of the API.
The example of JSON format is shown below:
```
{
```
```
"boolType": {
```
/*req, object, example of the capability of type bool*/
"@opt": [true, false]
/*req, array, options, subType: bool*/
```
},
```
```
"integerType": {
```
/*req, object, example of the capability of type integer*/
"@min": 0,
/*ro, req, int, the minimum value*/
"@max": 100
/*ro, req, int, the maximum value*/
```
},
```
```
"stringType": {
```
/*req, object, example of the capability of type string*/
"@min": 0,
/*ro, req, int, the minimum string size*/
"@max": 32
/*ro, req, int, the maximum string size*/
```
},
```
```
"enumType": {
```
/*req, object, capability example of type enum*/
"@opt": ["enum1", "enum2", "enum3"]
/*req, array, options, subType: string*/
```
}
```
```
}
```
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
```
Note: For the same capability set, devices of different models and versions may return different results. The values
```
shown in this document are only examples for reference. The capability set actually returned by the device takes
precedence.
ISAPI adopts ISO 8601 Standard Time Format, which is the same as W3C Standard Date and Time Formats.
4.2.4 Time Format
Hikvision co MMC
adil@hikvision.co.az
```
Format: YYYY-MM-DDThh:mm:ss.sTZD
```
```
YYYY = the year consisting of four decimal digits
```
```
MM = the month consisting of two decimal digits (01-January, 02-February, and so forth)
```
```
DD = the day consisting of two decimal digits (01 to 31)
```
```
hh = the hour consisting of two decimal digits (00 to 23, a.m. and p.m. are not allowed)
```
```
mm = the minute consisting of two decimal digits (00 to 59)
```
```
ss = the second consisting of two decimal digits (00 to 59)
```
```
s = one or more digits representing the fractional part of a second
```
```
TZD = time zone identifier (Z or +hh:mm or -hh:mm)
```
```
Example: 2017-08-16T20:17:06.123+08:00 refers to 20:17:06.123 on August 16, 2017 (local time which is 8 hours
```
```
ahead of UTC). The plus sign (+) indicates that the local time is ahead of UTC, and the minus sign (-) means that the
```
local time is behind UTC.
After the DST is enabled, the local time and time difference will change compared with UTC, and the values of related
fields also need to be changed. Disabling the DST will bring into the opposite effect.
```
Example: In 1986, the DST was in effect from May 4 at 2:00 a.m. (GMT+8). During the DST period, the clocks were
```
moved one hour ahead, which means that there was one less hour on that day. When the DST ends at 2:00 a.m. on
September 14, 1986, the clocks were moved one hour back and there was an extra hour on that day. The changes of the
time are as follows:
```
Notes:
```
```
{
```
"dateTime": "1986-05-03T18:00:00Z", /*device time. The value in TZ format is the UTC time and the value in TD format is the time difference between the
device's local time and UTC*/
"timeDiff": "+08:00" /*optional, time difference between the local time and UTC time. If this field does not exist, the user application will convert
the dateTime into the local time for use*/
```
}
```
To prevent characters not commonly used from resulting in exceptions in device programs and user applications, ISAPI
limits the valid field values of type string to a specific range of characters. Character sets allowed to be used in the fields
of type string in ISAPI are listed below.
DST Starts: 1986-05-04T02:00:00+08:00 --> 1986-05-04T03:00:00+09:00
DST Ends: 1986-09-14T02:00:00+09:00 --> 1986-09-14T01:00:00+08:00
The time difference cannot be simply used to determine the time zone. Because when the DST starts, the time
difference will change and it cannot represent the actual time zone.
```
Both TZ (UTC time, e.g., 1986-05-03T18:00:00Z) and TD (local time and time difference, e.g., 1986-05-
```
```
04T02:00:00+08:00) meet the time format standards of ISO 8601. In ISAPI, the TD format is recommended to be
```
used in messages sent from the user applications and the devices.
A few old-version devices will return the time in TZ format. For representing the time difference information and
forward compatibility, an extra field timeDiff is added as shown in the example below. User applications need to
support both TD format and TZ format when parsing the time in the messages returned by devices.
4.2.5 Character Set
```
Single-byte character set: lowercase letters (a-z), uppercase letters (A-Z), digits (0-9), and special characters (see
```
```
details in the table below).
```
```
Multi-byte character set: language characters based on Unicode and encoded by UTF-8 (UTF-8 encoding is a
```
```
transformation format of Unicode character set. For details, refer to RFC 2044).
```
Hikvision co MMC
adil@hikvision.co.az
No. Name Special Character No. Name Special Character
```
1 Open Parenthesis ( 18 Dollar Sign $
```
```
2 Close Parenthesis ) 19 Percent Sign %
```
3 Plus Sign + 20 Ampersand &
4 Comma , 21 Close Single Quotation Mark '
5 Minus Sign - 22 Asterisk *
6 Period . 23 Slash /
```
7 Semicolon ; 24 Smaller Than <
```
8 Equal Sign = 25 Greater Than >
9 At Sign @ 26 Question Mark ?
10 Open Square Bracket [ 27 Caret ^
11 Close Square Bracket ] 28 Open Single Quotation Mark '
12 Underscore _ 29 Vertical Bar |
```
13 Open Brace { 30 Tilde ~
```
```
14 Close Brace } 31 Double Quotation Marks "
```
15 Space 32 Colon :
16 Exclamation Mark ! 33 Backslash |
17 Octothorpe #
The valid characters that can be used in some special fields are listed below.
```
When requesting via ISAPI failed (the HTTP status code is not 200), the device will return the HTTP status code and
```
ISAPI error code. For HTTP status codes, refer to 10 Status Code Definitions in RFC 2616. For ISAPI error codes, refer to
Error Code Dictionary.
Message Example:
```
User name: lowercase letters (a-z), uppercase letters (A-Z), digits (0-9), and characters from No. 1 to No. 30 in the
```
special character table.
```
Password: User Name: lowercase letters (a-z), uppercase letters (A-Z), digits (0-9), and characters from No. 1 to
```
No. 33 in the special character table.
```
Names displayed on the UI (device name, person name, face picture library name, etc.): lowercase letters (a-z),
```
```
uppercase letters (A-Z), digits (0-9), characters from No. 1 to No. 15 in the special character table, and multi-byte
```
characters.
```
Normal fields of type string support lowercase letters (a-z), uppercase letters (A-Z), digits (0-9), characters from
```
No. 1 to No. 15 in the special character table, and multi-byte characters by default.
4.2.6 Error Processing
Hikvision co MMC
adil@hikvision.co.az
HTTP/1.1 403 Forbidden
```
Content-Type: application/json; charset="UTF-8"
```
```
Date: Thu, 15 Jul 2021 20:43:30 GMT
```
Content-Length: 229
```
Connection: Keep-Alive
```
```
{
```
"requestURL": "/ISAPI/Event/triggers/notifications/channels/whiteLightAlarm",
"statusCode": 4,
"statusString": "Invalid Operation",
"subStatusCode": "notSupport",
"errorCode": 1073741825,
"errorMsg": "notSupport"
```
}
```
```
When the rules configured on the device are triggered, the device will generate event messages (e.g., motion detection,
```
```
etc.) and actively upload them to the client. ISAPI supports three methods to receive event messages uploaded by the
```
device, that is, in arming mode, in listening mode, and via subscription.
The client establishes a HTTP persistent connection with the device to receive event messages from the device.
```
There are two methods (arming with subscription and arming without subscription) to receive events from the device.
```
The arming without subscription is to get all event messages from the device via HTTP GET method, while the arming
with subscription is to get messages of subscribed events via HTTP POST method.
Notes
Event Message Parsing:
4.3 Event Uploading
4.3.1 Arming
```
ISAPI arming (with or without subscription) uses the HTTP/HTTPS persistent connection. Due to the simplex
```
channel communication mode of HTTP, after establishing the arming connection, the device will send event
messages continuously, while it's not supported for clients to send any message to the device via the connection.
When the heartbeat timed out and no message is received from the device, you should terminate the arming
connection and try establishing a new one.
4.3.1.1 Arming without Subscription
1. Establish the connection of arming without subscription: GET /ISAPI/Event/notification/alertStream and keep
the connection alive via configuring Connection: keep-alive in HTTP headers on the client.
2. Receive events sent by the device. The event message will be separated and parsed by boundary. For parsing
details, see Event Message Parsing below.
3. Terminate the arming connection when no event message needs to be received.Hikvision co MMC
adil@hikvision.co.az
GET /ISAPI/Event/notification/alertStream HTTP/1.1
```
Host: <data_gateway_ip>
```
```
Connection: Keep-Alive
```
HTTP/1.1 401 Unauthorized
```
Date: Sun, 01 Apr 2018 18:58:53 GMT
```
```
Server:
```
Content-Length: 178
Content-Type: text/html
```
Connection: keep-alive
```
Keep-Alive: timeout=10, max=99
```
WWW-Authenticate: Digest qop="auth", realm="IP Camera(C2183)", nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d", stale="FALSE"
```
GET /ISAPI/Event/notification/alertStream HTTP/1.1
```
Authorization: Digest username="admin",realm="IP
```
```
Camera(C2183)",nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d",uri="/ISAPI/Event/notification/alertStream",cnonce="3d183a245b8729121ae4ca3d41b90f18
```
",nc=00000001,qop="auth",response="f2e0728991bb031f83df557a8f185178"
```
Host: 10.6.165.192
```
HTTP/1.1 200 OK
MIME-Version: 1.0
```
Connection: close
```
```
Content-Type: multipart/mixed; boundary=<frontier>
```
--<frontier>
```
Content-Type: application/xml; charset="UTF-8" <!--some event messages are uploaded in JSON format, and the upper layer needs to distinguish the message
```
format accroding to Content-Type when parsing event messages-->
Content-Length: text_length
<EventNotificationAlert/>
--<frontier>
```
Content-Disposition: form-data; name="Picture_Name"
```
Content-Type: image/pjpeg
Content-Length: image_length
[Picture Data]
--<frontier>
```
Note: <data_gateway_ip> and <frontier> are variables, [Picture Data] indicates the raw data of a picture.
```
After a client enables the listening service, when an event occurs, the device will send the event information actively to
the configured event receiving address. The event receiving address should be valid and configured on the device.
```
Notes:
```
4.3.2 Listening
The client and event service can be the same program.
In listening mode, no heartbeat information is generated on devices.
4.3.2.1 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az
1. Check whether the device supports configuring listening host parameters.
Get the configuration capability of the listening host: GET /ISAPI/Event/notification/httpHosts/capabilities.
If the node <HttpHostNotificationCap> is returned and its value is true, it indicates that the device supports
configuring listening host parameters.
2. Configure parameters of the listening host.
Configure parameters of all listening hosts: PUT /ISAPI/Event/notification/httpHosts?security=
```
<security>&iv=<iv>;
```
Get parameters of all listening hosts: GET /ISAPI/Event/notification/httpHosts?security=<security>&iv=
```
<iv>;
```
Configure parameters of a listening host: PUT /ISAPI/Event/notification/httpHosts/<hostID>?security=
```
<security>&iv=<iv>;
```
Get parameters of a listening host: GET /ISAPI/Event/notification/httpHosts/<hostID>?security=
<security>&iv=<iv>.
3. Enable the listening service.
You need to enable the listening service of the listening host.
4. (Optional) Test the listening service.
Hikvision co MMC
adil@hikvision.co.az
```
Note: You can also configure the listening parameters such as the time out via URL
```
/ISAPI/Event/notification/httpHosts/<hostID>/uploadCtrl.
When an event occurs or an alarm is triggered in listening mode, the event/alarm information can be uploaded with
```
binary data (such as pictures) and without binary data.
```
The Content-Type in headers of the HTTP request sent by the device is usually application/xml or application/json
as follows:
Alarm Message Sent by the Device
POST Request_URI HTTP/1.1 <!--Request_URI, related URI: POST /ISAPI/Event/notification/httpHosts-->
```
Host: data_gateway_ip:port <!--HTTP server's domain name / IP address and port No., related URI: POST /ISAPI/Event/notification/httpHosts-->
```
Accept-Language: en-us
```
Date: YourDate
```
```
Content-Type: application/xml; <!--Content Type, which is used for the upper layer to distinguish different formats when parsing the message-->
```
Content-Length: text_length
```
Connection: keep-alive <!--maintain the connection between the device and the server for better transmission performance-->
```
<EventNotificationAlert/>
Response by the Listening Host
HTTP/1.1 200 OK
```
Date: YourDate
```
```
Connection: close
```
```
The format of the data sent by the device is HTTP form (multipart/form-data). The Content-Type in headers of the HTTP
```
request is usually multipart/form-data, boundary=<frontier>, of which boundary is a variable used to divide the
```
HTTP body into multiple units, and each unit has its headers and body. See details in RFC 1867 (Form-based File
```
```
Upload in HTML). An example is shown below. Please note two hyphens -- before and after the boundary.
```
Alarm Message Sent by the Device
POST Request_URI HTTP/1.1 <!--Request_URI, , related URI: POST /ISAPI/Event/notification/httpHosts-->
```
Host: device_ip:port <!--HTTP server's domain name / IP address and port No., related URI: POST /ISAPI/Event/notification/httpHosts-->
```
Accept-Language: en-us
```
Date: YourDate
```
```
Content-Type: multipart/form-data;boundary=<frontier>
```
Content-Length: text_length
```
Connection: keep-alive <!--maintain the connection between the device and the server for better transmission performance-->
```
--<frontier>
```
Content-Disposition: form-data; name="Event_Type"
```
Content-Type: text/xml <!--some event messages are uploaded in JSON format, and the upper layer needs to distinguish the message format accroding to
Content-Type when parsing event messages-->
<EventNotificationAlert/>
--<frontier>
```
Content-Disposition: form-data; name="Picture_Name"
```
Content-Length: image_length
Content-Type: image/jpeg
[Picture Data]
--<frontier>--
Response by the Listening Host
4. (Optional) Test the listening service.
The platform applies the command to the device to test whether the listening host is available for the device: POST
/ISAPI/Event/notification/httpHosts/<hostID>/test.
5. The listening host receives event information from the device.
When an event occurs, the device creates an connection with the client and uploads alarm information actively.
Meanwhile, the listening host receives data from the device. See details in Event Messages.
4.3.2.2 Event Messages
1. Without Binary Data:
2. With Binary Data:
Hikvision co MMC
adil@hikvision.co.az
HTTP/1.1 200 OK
```
Date: YourDate
```
```
Connection: close
```
The description of some keywords are as follows:
Keyword Example Description
Content-
Type
```
multipart/form-data;
```
```
boundary=frontier Content type, multipart/form-data refers to data in form format.
```
boundary frontier Delimiter of the form message. A form message which starts with --boundary and ends with --boundary--.
Content-
Disposition
```
form-data;
```
```
name="Picture_Name"; Content description. form-data is a piece of form data.
```
filename "Picture_Name" File name. The file refers to the form message.
Content-
Length 10 Content length, starting from the next \r\n to the next --boundary.
Error Codes
statusCode statusString subStatusCode errorCode Description
6 Invalid Content eventNotSupport 0x60001024
With arming and subscription, the client can establish HTTP persistent connection with the device, and continuously
receive the event messages from the device.
For ISAPI event arming, the client can receive all types of events by GET method, or receive the subscribed events only
by POST method.
4.3.2.3 Exception Handling
```
5 Device (General)
```
5.1 Arming and Subscription
5.1.1 Introduction to the Function
5.1.2 API Calling Flow
5.1.2.1 Without Subscription
1. Establish a connection for arming: GET /ISAPI/Event/notification/alertStream. You need to set Connection:
keep-alive in HTTP Headers.
2. When receiving events sent by the device, the event messages can be separated and parsed by boundary. See
“Parsing Event Messages” below for details.
3. Disable the arming connection when you do not need to receive event messages.
5.1.2.1.2 Syntax
Hikvision co MMC
adil@hikvision.co.az
GET /ISAPI/Event/notification/alertStream HTTP/1.1
```
Host: <data_gateway_ip>
```
```
Connection: Keep-Alive
```
HTTP/1.1 401 Unauthorized
```
Date: Sun, 01 Apr 2018 18:58:53 GMT
```
```
Server:
```
Content-Length: 178
Content-Type: text/html
```
Connection: keep-alive
```
Keep-Alive: timeout=10, max=99
```
WWW-Authenticate: Digest qop="auth", realm="IP Camera(C2183)", nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d", stale="FALSE"
```
GET /ISAPI/Event/notification/alertStream HTTP/1.1
```
Authorization: Digest username="admin", realm="IP Camera(C2183)", nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d",
```
```
uri="/ISAPI/Event/notification/alertStream", cnonce="3d183a245b8729121ae4ca3d41b90f18", nc=00000001, qop="auth", response="f2e0728991bb031f83df557a8f185178"
```
```
Host: 10.6.165.192
```
HTTP/1.1 200 OK
MIME-Version: 1.0
```
Connection: close
```
```
Content-Type: multipart/form-data; boundary=<frontier>
```
--<frontier>
```
Content-Type: application/xml; charset="UTF-8" <!-- Some alarms are in JSON format, so the upper layer should parse based on the Content-Type field -->
```
Content-Length: text_length
<EventNotificationAlert/>
--<frontier>
```
Content-Disposition: form-data; name="Picture_Name"
```
Content-Type: image/jpeg
Content-Length: image_length
[Image Data]
--<frontier>
```
Note: <data_gateway_ip> and <frontier> are variables, and [Image Data] is an abbreviated representation
```
indicating the raw data of an image at this location.
5.1.2.2 Subscription
5.1.2.2.1 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az
1. Get device system capabilities: GET /ISAPI/System/capabilities.
2. Check if event subscription is supported: isSupportSubscribeEvent exists and its value is true. When
isSupportSubscribeEvent does not exist or its value is false, the device does not support event subscription.
3. Get the capability of arming with subscription: GET /ISAPI/Event/notification/subscribeEventCap.
4. Establish a connection of arming with subscription: POST /ISAPI/Event/notification/subscribeEvent. You need
to set Connection: keep-alive in HTTP Headers.
5. (Optional) Edit parameters of the existing subscription. You need to get the subscription parameters first: GET
/ISAPI/Event/notification/subscribeEvent/<subscribeEventID>. Then, edit the parameters based on the
existing subscription configurations: PUT /ISAPI/Event/notification/subscribeEvent/<subscribeEventID>.
6. Receive events sent by the device. The event messages will be separated and parsed by boundary. For parsing
description, see Event Messages Parsing below.
Hikvision co MMC
adil@hikvision.co.az
Note：
Three types of data will be transmitted on the arming link: <SubscribeEventResponse/>, <EventNotificationAlert/>,
and picture data. <SubscribeEventResponse/> is the data of first form sent by the device after arming established, see
```
the response parameters of URL (POST /ISAPI/Event/notification/subscribeEvent) for details; and
```
<EventNotificationAlert/> is the event content or heartbeat, you can identify the event type via field eventType, e.g.,
for heartbeat, the value of eventType is heartBeat.
POST /ISAPI/Event/notification/subscribeEvent HTTP/1.1
```
Host: device_ip
```
Accept-Language: zh-cn
```
Date: YourDate
```
```
Content-Type: application/xml;
```
Content-Length: text_length
```
Connection: Keep-Alive
```
<SubscribeEvent/>
HTTP/1.1 401 Unauthorized
```
Date: Sun, 01 Apr 2018 18:58:53 GMT
```
```
Server:
```
Content-Length: 178
Content-Type: text/html
```
Connection: keep-alive
```
Keep-Alive: timeout=10, max=99
```
WWW-Authenticate: Digest qop="auth", realm="IP Camera(C2183)", nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d", stale="FALSE"
```
POST /ISAPI/Event/notification/subscribeEvent HTTP/1.1
```
Authorization: Digest username="admin",realm="IP
```
```
Camera(C2183)",nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d",uri="/ISAPI/Event/notification/alertStream",cnonce="3d183a245b8729121ae4ca3d41b90f18
```
",nc=00000001,qop="auth",response="f2e0728991bb031f83df557a8f185178"
```
Host: device_ip
```
<SubscribeEvent/>
HTTP/1.1 200 OK
MIME-Version: 1.0
```
Connection: close
```
```
Content-Type: multipart/mixed; boundary=<frontier>
```
--<frontier>
```
Content-Type: application/xml; charset="UTF-8" <!--some event messages are uploaded in JSON format, and the upper layer needs to distinguish the message
```
format accroding to Content-Type when parsing event messages-->
Content-Length: text_length
<SubscribeEventResponse/>
--<frontier>
```
Content-Type: application/xml; charset="UTF-8" <!--some event messages are uploaded in JSON format, and the upper layer needs to distinguish the message
```
format accroding to Content-Type when parsing event messages-->
Content-Length: text_length
<EventNotificationAlert/>
--<frontier>
```
Content-Disposition: form-data; name="Picture_Name"
```
Content-Type: image/pjpeg
Content-Length: image_length
[Picture Data]
--<frontier>
After the arming connection with the device is established, the data sent by the device is in HTTP form format
```
(multipart/form-data). In an HTTP request, Content-Type in Headers is usually multipart/form-data,
```
```
boundary=AaB03x, and boundary is a variable used to divide HTTP Body into multiple units, each being a set of data and
```
```
has its own Headers and Body. For detailed format description, see RFC 1867 (Form-based File Upload in HTML). An
```
example is shown below. Note the dash -- before and after boundary. Under normal circumstances, the device will not
actively close the arming connection, so the device will not send the form format end symbol --AaB03x-- on the
arming connection.
7. (Optional) Terminate the connection of arming with subscription: PUT
/ISAPI/Event/notification/unSubscribeEvent?ID=<subscribeEventID>. When communicating with the device
via HTTP directly, there is no need to call this API. You can just terminate the connection.
5.1.2.2.2 Example
5.1.2.3 Event Messages Parsing
Hikvision co MMC
adil@hikvision.co.az
HTTP/1.1 200 OK
```
Content-Type: multipart/form-data; boundary=AaB03x
```
```
Connection: keep-alive
```
--AaB03x
```
Content-Disposition: form-data; name="ANPR.xml"; filename="ANPR.xml";
```
Content-Type: application/xml
Content-Length: 9
<ANPR/>
--AaB03x
```
Content-Disposition: form-data; name="licensePlatePicture.jpg"; filename="licensePlatePicture.jpg";
```
Content-Type: image/jpeg
Content-Length: 14
Image Data
--AaB03x--
The description of some keywords are as follows:
Keyword Example Description
Content-
Type
```
multipart/form-data;
```
```
boundary=AaB03x
```
Content type. multipart/form-data means the message is in form
format.
boundary AaB03x Delimiter of the form message. --boundary is the start of a form. --boundary-- is the end of the whole HTTP form message.
Content-
Disposition
```
form-data; name="ANPR.xml";
```
```
filename="ANPR.xml"; Content description.
```
name "ANPR.xml" Form name.
filename "ANPR.xml" File name of the form.
Content-
Length 9 Content length, starting from the next \r\n to the next --boundary.
```
Note that ISAPI arming (with or without subscription) uses HTTP/HTTPS persistent connection. Due to the simplex
```
channel communication mode of HTTP, after establishing the arming connection, the device will send out event
messages continuously, while you cannot send any message to the device via the connection.
After the heartbeat time, if you do not receive any message from the device, you should disable the arming connection
and try establishing a new one.
POST /ISAPI/Event/notification/subscribeEvent HTTP/1.1
```
Authorization: Digest username="admin",realm="IP
```
```
Camera(C2183)",nonce="4e5468694e7a42694e7a4d364f4449354d7a6b354d54513d",uri="/ISAPI/Event/notification/alertStream",cnonce="3d183a245b8729121ae4ca3d41b90f18
```
",nc=00000001,qop="auth",response="f2e0728991bb031f83df557a8f185178"
```
Host: device_ip
```
<SubscribeEvent/>
5.1.3 Restriction Description
5.1.4 Sample Messages
5.1.4.1 Establish Arming Subscription
5.1.4.2 The Device Responses and Uploads an Event Message
Hikvision co MMC
adil@hikvision.co.az
HTTP/1.1 200 OK
MIME-Version: 1.0
```
Connection: close
```
```
Content-Type: multipart/mixed; boundary=<frontier>
```
--<frontier>
```
Content-Type: application/xml; charset="UTF-8" <!--Some alarm messages are in JSON format, so when parsing messages, the upper-layer should distinguish
```
them according to the Content-Type field.-->
Content-Length: text_length
<SubscribeEventResponse/>
--<frontier>
```
Content-Type: application/xml; charset="UTF-8" <!--Some alarm messages are in JSON format, so when parsing messages, the upper-layer should distinguish
```
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
--<frontier>
```
Content-Disposition: form-data; name="Picture_Name"
```
Content-Type: image/pjpeg
Content-Length: image_length
Content-ID: image_ID
[Picture Data]
--<frontier>
When problems arise after a device is deployed on site, interaction message between the device and the external
network is necessary to help developers for troubleshooting. Packet capture can be stored on the local device, and
packet capture files can be exported after capture is complete. Also, packet capture files can be uploaded to cloud
storage, and packet capture data can be obtained in real-time even if the device does not have the storage space.
1. Device packet capture: save packet capture files on the local device, and export the files after capture is complete.
Also, uploading packet capture files to cloud storage after capture is complete is supported. Then the client can obtain
the storage URL and download packet capture files from the cloud storage.
2. Device real-time packet capture: after it is enabled, the device returns an URI for downloading packet capture data.
The client can submit this URI to the browser to download the packet data. The device transmits packet data via HTTP
Chunked, and users can store the packet data through the browser.
5.2 Calling Flow of Device Packet Capture
5.2.1 Function Introduction
5.2.2 API Calling Flow
5.2.2.1 Device Packet Capture
Hikvision co MMC
adil@hikvision.co.az
1. Get device system capabilities: GET /ISAPI/System/capabilities. Get to know if the device supports packet capture
by the field: <isSupportNetworkCapture>true</isSupportNetworkCapture>.
2. Check if the device supports packet captures: GET /ISAPI/System/networkCapture/capabilities?format=json. If
isSupportManualControl is true, the device supports packet capture. If isSupportManualControlAsyn is true, the
device supports asynchronous packet capture.
Hikvision co MMC
adil@hikvision.co.az
3. Get storage path information of device packet capture: GET /ISAPI/System/networkCapture/StoragePathInfo?
```
format=json.
```
4. Configure device packet capture parameters such as capture duration, storage path, port, and address: PUT
/ISAPI/System/networkCapture/captureParams?format=json.
5. Get device packet capture parameters such as capture duration, storage path, port, and address: GET
/ISAPI/System/networkCapture/captureParams?format=json.
6. Start device packet capture: depending on the parameters, packet capture files can be saved on the local device for
export after capture is complete, or packet capture files can be uploaded to cloud storage and downloaded via the
storage URL, or the packet capture data can be returned in real-time.
Start device packet capture: PUT /ISAPI/System/networkCapture/manualStart?format=json&asyn=<asyn>&realTime=
<realTime>.
```
Note:
```
7. After starting capture, you can repeatedly get capture status, including whether the capture is ongoing, the size of the
packet capture data, and the progress and storage URL for uploading the data to cloud storage.
Get status of device packet capture: GET /ISAPI/System/networkCapture/manualStatus?format=json.
8. Packet capture can be stopped at any time by calling the interface of stopping packet capture.
Stop device packet capture: PUT /ISAPI/System/networkCapture/manualStop?format=json.
9. (Optional) If packet capture data is stored on the local device, packet capture files need to be exported. If packet
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
1. Get device system capabilities: GET /ISAPI/System/capabilities.
<isSupportStartNetworkCapture>true</isSupportStartNetworkCapture> indicates the device supports starting
packet capture. <isSupportStopNetworkCapture>true</isSupportStopNetworkCapture> indicates the device supports
stopping packet capture. <isSupportGetNetworkCaptureStatus>true</isSupportGetNetworkCaptureStatus> indicates
the device supports getting packet capture status.
2. Get capabilities of packet capture parameters: GET /ISAPI/System/NetworkCaptureParams/capabilities?
```
format=json. The realTimeEnabled field indicates whether the device supports real-time packet capture.
```
3. Set the field realTimeEnabled as true in the parameters applied to the device to start device packet capture. The
device returns an URI, and the client can download the real-time packet capture data from the device through a
browser.
Start packet capture: POST /ISAPI/System/StartNetworkCapture?format=json&security=<security>&iv=<iv>.
```
Note:
```
4. After starting packet capture, you can repeatedly get packet capture status, including whether packet capture is
ongoing and the size of the packet capture data.
Get packet capture status: GET /ISAPI/System/GetNetworkCaptureStatus?format=json.
5. Packet capture can be stopped at any time by calling the interface of stopping packet capture.
Stop device packet capture: POST /ISAPI/System/StopNetworkCapture?format=json.
If realTimeEnabled=true is contained when starting device packet capture, it indicates packet capture data is
uploaded in real-time by HTTP Chunked. The URL for downloading the returned packet capture data is valid for 30
seconds by default. If the download is attempted after this time, the device should return an HTTP 404 status code.
5.3 Device Peripherals Upgrade
Hikvision co MMC
adil@hikvision.co.az
The platform or client software or web client under the LAN upgrades device peripherals via ISAPI.
The sequence diagram of upgrading device peripherals by the platform is shown below.
Time sync is a method to synchronize the time of all devices connecting to the NTP server, so that all devices can share
the same clock time for providing related functions based on time. Supported time sync types: NTP time sync, manual
sync, satellite time sync, platform time synchronization, etc. The following describes the method of NTP time sync.
5.3.1 Introduction to the Function
5.3.2 API Calling Flow
1. Get the device system capability GET /ISAPI/System/capabilities and check whether the device supports
upgrading peripherals. If the field isSupportAcsUpdate is returned and its value is true, it indicates that the device
supports this function, otherwise, the device does not support this function.
2. Get the capability of upgrading the peripherals module GET /ISAPI/System/AcsUpdate/capabilities, and get the
types and IDs of peripherals that support upgrading.
3. The platform sends the upgrade command POST /ISAPI/System/updateFirmware?type=<type>&moduleAddress=
<moduleAddress>&id=<indexID>. In the URL type refers to the peripheral type, moduleAddress refers to the
peripheral module address, and indexID refers to the ID of peripheral to be upgraded. The platform will apply the
upgrade peripheral package to the device.
4. Get the peripheral upgrade progress GET /ISAPI/System/upgradeStatus?type=<Type>.
5. Log in to the device again.
6. Get the peripheral latest version information.
5.4 Device Time Sync
5.4.1 Introduction to the Function
5.4.1.1 NTP Time Sync
Hikvision co MMC
adil@hikvision.co.az
```
The local system of running NTP can receive sync from other clock sources (self as client), other clocks can sync from
```
```
the local system (self as server), and sync with other devices.
```
The basic working principle of NTP is shown in the picture. Device A and Device B are connected via the network, and
their systems follow their own independent system time. To auto sync their time, you can set device time auto sync via
NTP. For example:
Before time sync between Device A and Device B, the time of Device A is 10:00:00 am, and that of Device B is 11:00:00
am. Device B is set as the server of NTP server, so that the time of Device A should be synchronized with that of Device
B. The time of NTP message transmitted between Device A and Device B is 1 second.
The working process of system clock synchronization is as follows:
```
Device A sends an NTP message to Device B with a timestamp of 10:00:00 am (T1) that is when it leaves Device A.
```
```
When the NTP message reaches Device B. Device B will add its own timestamp, which is 11:00:01 am (T2).
```
```
Then the NTP message leaves Device B with Device B's timestamp, which is 11:00:02 am (T3).
```
```
Device A receives the response message, and the local time of Device A is 10:00:03 am (T4).
```
Above all, Device A can calculate two important parameters:
```
Round-trip delay of NTP message: Delay = (T4-T1) - (T3-T2) = 2 seconds.
```
```
Time difference between Device A and Device B: offset = ((T2-T1)+(T3-T4))/2=1 h.
```
Device A can sync its own time with that of Device B according to calculation results.
1. Get the Capability of Device Time synchronization Management
You can call this API to get the time sync types currently supported by the device, such as NTP time sync, manual time
sync, satellite time sync, EZ platform time sync.
Get the capability: GET /ISAPI/System/time/capabilities.
2. Set device time synchronization management parameters
You can configure the time synchronization mode as follows：
```
Get device time synchronization management parameters: GET /ISAPI/System/time;
```
Set device time synchronization management parameters: PUT /ISAPI/System/time；
```
NTP time synchronization: See 4.2.2 NTP Time Sync (Client).
```
Manual time synchronization: Set the value of timeMode to manual, and set the device local time in nodes localTime、
timeZone.
5.4.2 API Calling Flow
5.4.2.1 Time Sync Configuration
Hikvision co MMC
adil@hikvision.co.az
Satellite time synchronization: Set the value of timeMode to satellite, and set the device local time in nodes
satelliteInterval.
Platform time synchronization: Set the value of timeMode to platform.
```
Note： For manual time synchronization (time offset including time zone offset): Set manual time synchronization:
```
```
localTime refers to the local time on device (time offset excluded, in format like 2019-02-28T10:50:44); timeZone refers
```
```
to the time offset of local time on device (time offset format with DST disabled: CST-8:00:00; time offset format with
```
```
DST enabled: CST-8:00:00DST00:30:00,M4.1.0/02:00:00,M10.5.0/02:00:00); Get manual time synchronization: localTime
```
```
refers to the local time on device (time offset included, in format like 2019-02-28T10:50:44+8:30); timeZone refers to
```
```
the time offset of local time on device (time offset format with DST disabled: CST-8:00:00; time offset format with DST
```
```
enabled: CST-8:00:00DST00:30:00,M4.1.0/02:00:00,M10.5.0/02:00:00).
```
1. Get device time zone configuration capability
Call GET /ISAPI/System/capabilities to get the system capability. When isSupportTimeZone is returned, the time
zone configuration is supported by the device.
2. Configure time zone parameters
Get the device's time zone parameters: GET /ISAPI/System/time/timeZone. Set the device's time zone parameters: PUT
/ISAPI/System/time/timeZone.
```
If DST (Daylight Saving Time) is disabled, the example of returned time zone parameters is: CST-8:00:00. It refers to
```
```
UTC+8, and -8:00:00 is the UTC local time. If DST (Daylight Saving Time) is enabled, the example of returned time zone
```
parameters is: CST-8:00:00DST00:30:00,M4.1.0/02:00:00,M10.5.2/02:00:00. It refers to UTC+8, the DST time is 30
minutes ahead of local time, the DST starts at 02:00:00 on the first Sunday of April and ends at 02:00:00 on the fifth
```
Tuesday of October. MX.Y.Z: X is the month, Y is the week number in the month, Z is the day of a week (0-Sunday, 1-
```
```
Monday, 2-Tuesday, 3-Wednesday, 4-Thursday, 5-Friday, 6-Saturday).
```
```
The local system running the NTP server can receive sync information from other clock sources (self as client), sync
```
```
other clocks (self as server) as clock sources, and sync with other devices. Calling flow (self as client):
```
5.4.2.2 Time Zone Configuration
```
5.4.2.3 NTP Time Sync (Client)
```
Hikvision co MMC
adil@hikvision.co.az
1. Check whether the device supports synchronizing time via NTP server Get the capability of the device: GET
```
/ISAPI/System/time/capabilities; and check whether timeMode supports NTP.
```
2. Set access parameters of the NTP server
Supports accessing the NTP server by IP address to synchronize the device time.
Get the access parameter capability of the NTP server: GET /ISAPI/System/time/ntpServers/capabilities
Set access parameters of the NTP server: PUT /ISAPI/System/time/ntpServers
Get access parameters of the NTP server: GET /ISAPI/System/time/ntpServers
3. Set the time mode of the device to NTP
Supports setting the value of timeMode to NTP.
Get device time synchronization management parameters: GET /ISAPI/System/time Set device time synchronization
management parameters: PUT /ISAPI/System/time
```
The local system running the NTP server can receive sync information from other clock sources (self as client), sync
```
```
other clocks (self as server) as clock sources, and sync with other devices. Calling flow (self as server):
```
```
5.4.2.4 NTP Time Sync (Server Mode)
```
Hikvision co MMC
adil@hikvision.co.az
1. Check whether the device supports configuring NTP service Get the capability of device time synchronization
```
management: GET /ISAPI/System/time/capabilities; If isSupportNtp is returned, it indicates that the device
```
supports time synchronization management.
2. Set NTP server to the server mode
Supports setting the value of mode to server.
Get the capability of server mode: GET /ISAPI/System/time/ntp/capabilities?format=json
Set NTP to server mode: PUT /ISAPI/System/time/ntp?format=json
Get parameters of NTP server mode: GET /ISAPI/System/time/ntp?format=json
3. Set the parameters of NTP server
Supports setting the IP address of the NTP server.
Get the capability of NTP server: GET /ISAPI/System/time/NTPService/capabilitis?format=json
Set the NTP server parameters: PUT /ISAPI/System/time/NTPService?format=json
Get the parameters of the NTP server: GET /ISAPI/System/time/NTPService?format=json
4. Synchronize the device’s NTP service information with other devices
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
The platform or client software or web client under the LAN upgrades devices via ISAPI.
The sequence diagram of upgrading devices by the platform is shown below.
5.5 Device Upgrade
5.5.1 Introduction to the Function
5.5.2 API Calling Flow
1. Upgrade devices.
Upgrade the device firmware: POST /ISAPI/System/updateFirmware.
2. Get the device upgrade progress.
Hikvision co MMC
adil@hikvision.co.az
```
Some functions are mutually exclusive due to the device performance (for example, function A and function B cannot
```
```
run at the same time, i.e, only one of them is allowed at one time).
```
The following three APIs are available for the integration of mutually exclusive functions:
Considering that the device is connected to EZ via EZ 2.0 Protocol, EZ OTA upgrade solution is not supported. This
solution applies to specified version upgrade.
Get the device upgrade progress: GET /ISAPI/System/upgradeStatus.
3. Reboot devices.
Reboot devices: PUT /ISAPI/System/reboot.
5.6 Mutually Exclusive Functions
5.6.1 Introduction to the Function
5.6.2 API Calling Flow
1. Get the information of mutually exclusive functions: GET /ISAPI/System/mutexFunction/capabilities?
```
format=json. Call this URL to get the list of existing mutually exclusive functions supported by the device. Note:
```
```
NVR devices only support setting exlusive function "perimeter" (perimeter protection), and do not support
```
```
"linedetection" (line crossing detection), "fielddetection" (intrusion detection), "regionEntrance" (region entrance),
```
```
or "regionExiting" (region exiting).
```
2. Search for the functions that are mutually exclusive with a specified function: POST
/ISAPI/System/mutexFunction?format=json. Based on the list of mutually exclusive functions returned by GET
/ISAPI/System/mutexFunction/capabilities?format=json, you can search for the mutual exclusion status of a
specified function and see whether to change the settings and disbale the mutually exclusive function.
3. Get the mutual exclusion information when device function exception occurs: GET
/ISAPI/System/mutexFunctionErrorMsg. After getting the error code, you can call this API to get the current
mutually exclusive functions.
5.7 Remote Online Upgrade Based on The EZ2.0
5.7.1 Introduction to the Function
5.7.2 API Calling FlowHikvision co MMC
adil@hikvision.co.az
1. Search for the device firmware ID: GET /ISAPI/System/firmwareCodeV2.
2. Search for the device upgrade information by its firmware ID. If there is an available new version, apply the
upgrade task to the device: POST /ISAPI/System/onlineUpgrade/task?format=json. You can specify to upgrade
```
device (e.g., NVR) or sub-device (e.g., IPC) via the node <channel>.
```
Hikvision co MMC
adil@hikvision.co.az
This solution applies to remote online upgrade of the devices and sub-devices connected to WEB client.
```
device (e.g., NVR) or sub-device (e.g., IPC) via the node <channel>.
```
3. During the device upgrade, you can get the real-time upgrade progress on the platform: GET
/ISAPI/System/onlineUpgrade/status.
4. After the device upgrade is finished, the device will upload the "onlineUpgradeStatus" and reboot automatically.
5. After both upgrade and reboot are finished, you can get the latest device version information on the platform.
```
Get the device (e.g., NVR) version information: GET /ISAPI/System/deviceInfo.
```
```
Get the sub-device (e.g., IPC) version information: GET /ISAPI/ContentMgmt/InputProxy/channels?security=
```
<security>&iv=<iv>.
5.8 Remote Online Upgrade Based on the WEB Client
5.8.1 Introduction to the Function
5.8.2 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az
1. Get device online upgrade capability: GET /ISAPI/System/onlineUpgrade/capabilities.
2. Manually trigger the device online upgrade inspection: POST /ISAPI/System/onlineUpgrade/PatrolInspection?
```
format=json. After it is enabled, the device will search for the available new version.
```
3. During the inspection, the WEB client can get the real-time inspection progress: GET
/ISAPI/System/onlineUpgrade/PatrolInspection/Status?format=json.
4. After the device inspection is finished, search for the device and sub-device upgrade information: GET
/ISAPI/System/onlineUpgrade/SearchDevInfo?format=json.
5. Apply the upgrade task: PUT /ISAPI/System/onlineUpgrade/upgrade?type=<type>&id=<indexID>&channelID =
<channelID>. You can upgrade a specified device via the node <channelID> in the URL. Specify sub-device
upgrade by configuring <type>.
Hikvision co MMC
adil@hikvision.co.az
Information management of device accessed the serial are as follows: 1. Configure manufacturer, type, and model
information of the specific serial port access device. 2. Search for the device type or model supported by the specific
serial port.
1. Check whether the device supports information management of serial port. Get the capability of the device serial
```
port: GET /ISAPI/System/Serial/capabilities; If <isSupportDeviceInfo> is returned, the device supports
```
information configuration of devices access the serial port.
2. Set the information of serial port:
3. Check whether the device supports linking information of devices access the serial port: GET
```
/ISAPI/System/Serial/capabilities; If <isSupportSearchDeviceInfoRelations> is returned, it indicates that the
```
device supports searching for linked information od devices access the serial port.
4. Search for linked information of devices access the serial port.
RS485, RS422 and RS232 serial ports external to the device are used as transparent channels to transmit serial port
```
data. Supports the client sending serial data to the device, which then forwards the data to the serial port; conversely,
```
when the serial port sends data to the device, which transparently transmits the data to the client. Note that the device's
transparent transmission of serial data is half-duplex communication, meaning that bidirectional communication can be
implemented between the device and the client, but the communication data is not necessarily in a question-and-
answer format, and the client must match the request and response relationship on its own.
Since most standard HTTP request libraries do not support the persistent connection for receiving and sending data in
real time, it is recommended that the client uses two TCP clients to implement the sending and receiving of
6. You can search for online upgrade status during the upgrade: GET /ISAPI/System/onlineUpgrade/SearchStatus?
```
format=json.
```
7. You can cancel the upgrade during the upgrade: PUT /ISAPI/System/onlineUpgrade/CancelUpgrade?
```
format=json.
```
8. After the upgrade and reboot are finished, you can get the latest device version information.
```
Get the device (e.g., NVR) version information: GET /ISAPI/System/deviceInfo.
```
```
Get the sub-device (e.g., IPC) version information: GET /ISAPI/ContentMgmt/InputProxy/channels?security=
```
<security>&iv=<iv>.
5.9 Serial Port Accessed External Device Management
5.9.1 Introduction to the Function
5.9.2 API Calling Flow
Get the capability of device information parameters of a single serial port: GET
/ISAPI/System/Serial/ports/<portID>/deviceInfo?format=json.
Get device information parameters access single serial port: GET
/ISAPI/System/Serial/ports/<portID>/deviceInfo?format=json.
Set device information parameter of single serial port: PUT /ISAPI/System/Serial/ports/<portID>/deviceInfo?
```
format=json.
```
Get the capability of searching for linked parameters of information of devices access a single serial port: GET
/ISAPI/System/Serial/ports/<portID>/searchDeviceInfoRelations/capabilities?format=json.
Search for linked parameters of information of devices access a single serial port:POST
/ISAPI/System/Serial/ports/<portID>/searchDeviceInfoRelations?format=json.
5.10 Serial Port Data Transparent Transmission
5.10.1 Introduction to the Function
Hikvision co MMC
adil@hikvision.co.az
transparently transmitted serial data.
1. Check whether the device supports serial port data transmission.
Get the capability of the device serial port: GET /ISAPI/System/capabilities. If SerialCap is returned and the value is
true, it indicates that the device supports the functions of the serial port.
2. Set parameters of the transmission channel list.
5.10.2 API Calling Flow
Get parameters of the specific transmission channel: GET
/ISAPI/System/Serial/ports/<portID>/Transparent/channels/<channelID>.
Configure parameters of the specific transmission channel: GET
Hikvision co MMC
adil@hikvision.co.az
3. Open the transmission channel: PUT
```
/ISAPI/System/Serial/ports/<portID>/Transparent/channels/<channelID>/open;
```
4. Transmit serial port data via transparent channel.
5. Close the transmission channel: PUT
/ISAPI/System/Serial/ports/<portID>/Transparent/channels/<channelID>/close.
Serial port parameter configuration.
1. Check whether the device supports configuring serial port parameters.
Get the capability of device serial port: `GET /ISAPI/System/capabilities. If is returned and its value is true, the device
supports functions of serial port.
3. Get parameters of all serial ports.
4. Set control parameters of a single serial port.
5. Get the status of single serial port:GET /ISAPI/System/Serial/ports/<portID>/status.
```
Sub-device Batch Upgrade (Single Task): applicable to situations of upgrading multiple sub-devices using one
```
upgrade package. Application scenarios include: when the UWB positioning anchor connects to the web, upgrading
```
multiple tags (sub-devices) through the positioning engine (gateway), with the same upgrade package.
```
Management of Sub-device Batch Upgrade Tasks: There are many types of sub-devices, such as LoRa nodes, which
have a slow upgrade process and different models of LoRa nodes in the field also require different upgrade packages.
Therefore, it is necessary to support the creation of multiple upgrade tasks at once, entrusting the upgrade to the
devices, to enhance the practicality of batch upgrading sub-devices.
```
Sub-device Batch Upgrade (Single Task)
```
Get the device capability: /ISAPI/System/capabilities.
If the node isSupportBulkUpgradeChildDevice exists and is true, it indicates that the device support the function.
/ISAPI/System/Serial/ports/<portID>/Transparent/channels/<channelID>.
Receive data uploaded by device serial port through transmission channel: GET
/ISAPI/System/Serial/ports/<portID>/Transparent/channels/<channelID>/transData.
Send data to device serial port through transmission channel: PUT
/ISAPI/System/Serial/ports/<portID>/Transparent/channels/<channelID>/transData.
5.11 Serial Port Parameter Configuration
5.11.1 Introduction to the Function
5.11.2 API Calling Flow
Get the capability of all serial ports: GET /ISAPI/System/Serial/capabilities.
Get control parameters of all serial ports: GET /ISAPI/System/Serial/ports?permissionController=<indexID>.
Get control parameters of single serial port: GET /ISAPI/System/Serial/ports/<portID>?permissionController=
<indexID>.
Configure control parameters of single serial port: PUT /ISAPI/System/Serial/ports/<portID>?
```
permissionController=<indexID>.
```
5.12 Sub-device Batch Upgrade
5.12.1 Introduction to the Function
5.12.2 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az
If the node isSupportSearchBulkUpgradeChildDeviceProgress exists and is true, it indicates that the device support
getting the progress of batch upgraading sub-devices.
Sub-device batch upgrade: POST /ISAPI/System/BulkUpgradeChildDeviceList?format=json.
Batch sub-device upgrade progress search: POST /ISAPI/System/BulkUpgradeChildDeviceList/Search?format=json.
Sub-device Batch Upgrade Task Management
Get device system capabilities /ISAPI/System/capabilities, If the node isSupportBulkUpgradeChildDevice exists
and is true, it indicates that batch upgrade of sub devices is supported,
If the node isSupportSearchBulkUpgradeChildDeviceProgress exists and is true, it indicates that progress of batch
upgrading sub devices can be searched,
If the node isSupportSearchBulkUpgradeChildDeviceTask exists and is true, it indicates that batch upgrading devices
can be searched,
If the node isSupportModifyBulkUpgradeChildDeviceTask exists and is true, it indicates that batch upgrading sub
devices can be edited,
If the node isSupportDeleteBulkUpgradeChildDeviceTask exists and is true, it indicates that task of batch upgrading
sub devices can be deleted.
Get the capability of batch upgrading sub-device: GET /ISAPI/System/BulkUpgradeChildDevice/capabilities?
```
format=json.
```
Batch upgrade sub devices: POST /ISAPI/System/BulkUpgradeChildDeviceList?format=json.****
Search for tasks of batch sub-device upgrade: POST /ISAPI/System/ModifyBulkUpgradeChildDeviceTask?
```
format=json.
```
Edit tasks of batch sub-device upgrade: PUT /ISAPI/System/ModifyBulkUpgradeChildDeviceTask?format=json.****
Delete tasks of batch sub-device upgrade: PUT /ISAPI/System/DeleteBulkUpgradeChildDeviceTask?format=json.
```
Note: 1. The two methods for batch upgrading child devices are the same API: POST
```
/ISAPI/System/BulkUpgradeChildDeviceList?format=json. If the BulkUpgradeChildDeviceListCap.taskID is
returned in GET /ISAPI/System/BulkUpgradeChildDevice/capabilities?format=json, it indicates that the task
method is supported in the sub device upgrade. 2. To determine which sub devices can be upgraded, you can use the
API POST /ISAPI/IoTGateway/Childmanage/SearchChild?format=json. Sub devices with the tag isUpgradable and
value true indicate that the sub devices support upgrades.
This solution applies to the upgrade of devices and sub-devices connected via ISAPI. If the device is connected via ISAPI
```
protocols, it is required to set up HTTP(s) service to store device upgrade package and generate URL for downloading
```
upgrade package. If the device is connected via HCNetSDK, you can implement the device upgrade via transmitting
ISAPI.
5.13 Upgrade Based on Interactive Tools Local Deployment
5.13.1 Introduction to the Function
5.13.2 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az
1. Search for the device firmware ID: GET /ISAPI/System/firmwareCodeV2.
2. Search for the device upgrade information by firmware ID on the SWMS/EZ Cloud, download upgrade package to
local storage, and apply the upgrade task to the device: POST /ISAPI/System/onlineUpgrade/task?format=json.
```
You can specify to upgrade device (e.g., NVR) or sub-device (e.g., camera) via the node <channel>.
```
3. During the upgrade, you can get the real-time upgrade progress: GET /ISAPI/System/onlineUpgrade/status.
4. After upgrade is completed, the device will upload the "onlineUpgradeStatus" (upgrade status), and reboot
automatically.
5. After the device rebooting, you can get the latest device version information.
```
Get the device (e.g., NVR) version information: GET /ISAPI/System/deviceInfo.
```
```
Get the sub-device (e.g., IPC) version information: GET /ISAPI/ContentMgmt/InputProxy/channels?security=
```
Hikvision co MMC
adil@hikvision.co.az
This solution applies to the upgrade of devices and sub-devices connected via ISAPI and ISUP. If via ISAPI, it is required
```
to set up HTTP(s) service or transfer binary upgrade package files so as to store device upgrade package and generate
```
URL for downloading upgrade package. If via ISUP, it is required to set up FTP service to store device upgrade package
and generate URL for downloading upgrade package. If the device is connected via HCNetSDK protocols, you can
realize device upgrade via transmitting ISAPI.
<security>&iv=<iv>.
5.14 Upgrade Based on Platform Local Deployment
5.14.1 Introduction to the Function
5.14.2 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az
When an event occurs, the device creates connection with the client and uploads alarm information. Meanwhile, the
listening host receives data from the device. The IP address and the port No. of the listening host should be configured
for the device. The HTTP listening service supports subscribing to specific events when adding or editing the listening
```
host. Only the specified events will be uploaded by the device.(currently not available for the device)
```
1. Search for device firmware ID on the platform: GET /ISAPI/System/firmwareCodeV2.
2. Search for the device upgrade information in DAC by device firmware ID on the platform. If there is an available
new version, DAC will trigger an upgrade task and apply it to the device: POST
```
/ISAPI/System/onlineUpgrade/task?format=json. You can specify to upgrade device (e.g., NVR) or sub-device
```
```
(e.g., IPC) via the node <channel>.
```
3. During the upgrade, you can get the real-time upgrade progress on the platform: GET
/ISAPI/System/onlineUpgrade/status.
4. After the device upgrade is finished, the device will upload the "onlineUpgradeStatus" (upgrade status), and will
reboot automatically.
5. After the upgrade and reboot are finished, you can get the latest device version information on the platform.
```
Get the device (e.g., NVR) version information: GET /ISAPI/System/deviceInfo.
```
```
Get the sub-device (e.g., IPC) version information: GET /ISAPI/ContentMgmt/InputProxy/channels?security=
```
<security>&iv=<iv>.
6 Network Configuration
6.1 Listening Service
6.1.1 Introduction to the Function
Hikvision co MMC
adil@hikvision.co.az
6.1.2 API Calling Flow
6.1.2.1 Listening Service
Hikvision co MMC
adil@hikvision.co.az
```
Remark: You can also configure the listening parameters such as the timeout.
```
```
When an event occurs or an alarm is triggered, the event/alarm information can be with binary data (such as pictures)
```
and without binary data.
The Content-Type in the Headers of the HTTP request sent by the device is usually application/xml or
application/json as follows:
Alarm Message Sent by the Device
POST Request_URI HTTP/1.1 <!--/Request_URI, related URI: POST /ISAPI/Event/notification/httpHosts-->
```
Host: data_gateway_ip:port <!--Host: HTTP server's domain name / IP address and port No., related URI: POST /ISAPI/Event/notification/httpHosts-->
```
Accept-Language: zh-cn
```
Date: YourDate
```
```
Content-Type: application/xml; <!--content type, which is used for the upper layer to distinguish different formats when parsing the message-->
```
Content-Length: text_length
```
Connection: keep-alive <!--maintain the connection between the device and the server for better transmission performance-->
```
<EventNotificationAlert/>
Response by the Listening Host Notes:
1. Check whether the device supports configuring listening host parameters:
Get the configuration capability of the listening host: GET /ISAPI/Event/notification/httpHosts/capabilities.
If the node <HttpHostNotificationCap> exists in the returned message and its value is true, it indicates that the
device supports configuring listening host parameters.
2. Configure the parameters of the listening host:
Configure the parameters of all listening hosts: PUT /ISAPI/Event/notification/httpHosts?security=
```
<security>&iv=<iv>;
```
Get the parameters of all listening hosts: GET /ISAPI/Event/notification/httpHosts?security=<security>&iv=
```
<iv>;
```
Configure the parameters of a listening host: PUT /ISAPI/Event/notification/httpHosts/<hostID>?security=
```
<security>&iv=<iv>;
```
Get the parameters of a listening host: GET /ISAPI/Event/notification/httpHosts/<hostID>?security=
```
<security>&iv=<iv>;
```
3. Enable the listening service:
The user needs to enable the listening service of the listening host.
4. (Optional) Test the listening service:
The platform applies the command to the device to test whether the listening host is available for the device: POST
/ISAPI/Event/notification/httpHosts/<hostID>/test.
5. The listening host receives event information from the device:
When an event occurs, the device creates connection with the client and uploads alarm information. Meanwhile,
the listening host receives data from the device. See details in Event Message Grammar.
6.1.2.2 Event Message Grammar
1. Without Binary Data:
1. Content-Length is required and its value is 0.
2. Connection is recommended to use keep-alive to reduce the port usage.
Hikvision co MMC
adil@hikvision.co.az
HTTP/1.1 200 OK
Content-Length: 0
```
Connection: keep-alive
```
```
The format of the data sent by the device is HTTP form (multipart/form-data). The Content-Type in the Headers of the
```
HTTP request sent by the device is usually multipart/form-data, boundary=<frontier>: boundary is a variable, which
is used to divide the HTTP Body into multiple units and each unit has its Headers and Body. See details in RFC 1867
```
(Form-based File Upload in HTML). Please note the -- before and after the boundary.
```
Alarm Message Sent by the Device
POST Request_URI HTTP/1.1 <!--Request_URI, related URI: POST /ISAPI/Event/notification/httpHosts-->
```
Host: device_ip:port <!--Host: HTTP server's domain name / IP address and port No., related URI: POST /ISAPI/Event/notification/httpHosts-->
```
Accept-Language: zh-cn
```
Date: YourDate
```
```
Content-Type: multipart/form-data;boundary=<frontier>
```
Content-Length: text_length
```
Connection: keep-alive <!--maintain the connection between the device and the server for better transmission performance-->
```
--<frontier>
```
Content-Disposition: form-data; name="Event_Type"
```
Content-Type: text/xml <!--Some alarms use JSON format, so the upper-layer application can distinguish based on the Content-Type during parsing-->
<EventNotificationAlert/>
--<frontier>
```
Content-Disposition: form-data; name="Picture_Name"
```
Content-Length: image_length
Content-Type: image/jpeg
[picture data]
--<frontier>--
Response by the Listening Host
```
Notes:
```
HTTP/1.1 200 OK
Content-Length: 0
```
Connection: keep-alive
```
Here are the descriptions of the main keywords.
keyword example description
```
Content-Type multipart/form-data;boundary=frontier Content type, multipart/form-data refers to data in form format.
```
boundary frontier Separator of the form message. A form message starts with --boundaryand ends with --boundary--.
Content-
Disposition
```
form-data;
```
```
name="Picture_Name"; Content description. form-data refers to data in the form format.
```
filename "Picture_Name" File name. The file refers to the form message.
Content-
Length 10
Content length. The length of the content which starts from \r\n to the
next --boundary.
2. With Binary Data
1. Content-Length is required and its value is 0.
2. Connection is recommended to use keep-alive to reduce the port usage.
6.1.3 Exception Handling
6.1.3.1 Error Codes
Hikvision co MMC
adil@hikvision.co.az
statusCode statusString subStatusCode errorCode errorMsg Description Remarks
6 InvalidContent eventNotSupport 0x60001024 Event subscription is notsupported.
Picture comparison with captured picture library
Scene application: Search for similar person in face picture library, which can be used for identity confirmation.
7 VCA
7.1 Face Picture Library Management
7.1.1. Search via Picture Comparison in Face Capture Library
7.1.1.1 Introduction to the Function
7.1.1.2 API Calling Flow
1. Check whether the device supports searching by picture synchronously.
Get the capability of searching via picture comparison: GET /ISAPI/Intelligent/FDLib/capabilities?
```
format=json. If the node isSuportFSSearchByPic is returned and its value is true, it indicates that searching via
```
picture comparison synchronously is supported.
```
Note: For some devices supporting searching via picture comparison synchronously, the API for getting the
```
capability is invalid, you can call POST /ISAPI/Intelligent/FDLib/searchByPic?format=json directly.
2. Three methods are supported when searching picture.
By URL:
Hikvision co MMC
adil@hikvision.co.az
This function is for the two-way audio between the client and device. When you call the API to implement the two-way
audio, it requires the client to collect and encode the local audios and to decode the device audio data.
```
Note: Before starting two-way audio, check whether the way of collecting device audio data, audio encoding format,
```
volume, etc., is correct or not. The audio encoding format of the client should be consistent with the device audio
encoding format.
Based on the picture storage server, picture can be uploaded and you can get the picture URL to download the
picture file via the URL.
By model data:
```
Get face picture capability: GET /ISAPI/SDT/Face/pictureAnalysis/capabilities;
```
```
Analyze (model) face pictures: POSTT /ISAPI/SDT/Face/pictureAnalysis; Return picture modeling data:
```
targetModelData.
By binary picture:
Read binary picture files.
3. Submit synced face picture library to use picture to search picture
Search via picture comparison in face capture library: POST /ISAPI/Intelligent/FDLib/searchByPic?
```
format=json;
```
```
Note: Input parameter node dataType include three modes. Picture URL corresponds to faceURL, model data
```
corresponds to targetModelData, binary data mode is in form of form, and its JSON data is followed by binary
picture data.
The request message example of binary picture data is as follows:
POST /ISAPI/Intelligent/FDLib/searchByPic?format=json
```
Host: device_ip:port
```
Accept-Language: zh-cn
```
Date: YourDate
```
```
Content-Type: multipart/form-data;boundary=<frontier>
```
Content-Length: text_length
```
Connection: keep-alive
```
--<frontier>
```
Content-Disposition: form-data; name=""
```
Content-Type: application/json
[JSON message]
--<frontier>
```
Content-Disposition: form-data; name="Picture_Name"
```
Content-Length: image_length
Content-Type: image/jpeg
[Picture data]
--<frontier>--
8 Two-Way Audio
8.1 Two-Way Audio
8.1.1 Introduction to the Function
8.1.2 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az
```
Note:
```
1. Get the capability of configuring audio parameters for all two-way audio channels: GET
/ISAPI/System/TwoWayAudio/channels/capabilities. Check whether the device supports two-way audio. If the
HTTP status code 200 OK is returned, then the device supports two-way audio.
2. Get the audio parameters of all two-way audio channels: GET /ISAPI/System/TwoWayAudio/channels. Get the No.
of two-way audio channel for response and parsing <id>, audio type <audioCompressionType>, frame rate
<audioBitRate>, sampling rate <audioSamplingRate> and so on, to ensure the consistent of audio format during
the two-way audio process.
3. Set the audio parameters of one two-way audio channel: PUT /ISAPI/System/TwoWayAudio/channels/<audioID>.
This step is optional, and the <audioID> is the channel No. <id> responded and parsed in step 2.
4. Start two-way audio: PUT /ISAPI/System/TwoWayAudio/channels/<audioID>/open.
5. Create an HTTP persistent connection to receive the two-way audio data: GET
/ISAPI/System/TwoWayAudio/channels/<audioID>/audioData.
6. Create an HTTP persistent connection to send the two-way audio data: PUT
/ISAPI/System/TwoWayAudio/channels/<audioID>/audioData.
7. When the two-way audio ends, the client disables the persistent connections in steps 6 and 7 and sends the
message of stopping the two-way audio: PUT /ISAPI/System/TwoWayAudio/channels/<audioID>/close.
Two-way audio over ISAPI supports digest authentication.
Hikvision co MMC
adil@hikvision.co.az
Statistics of audio types with fixed lengths:
Audio Type Fixed Length Frame Interval
G.722.1 80 40ms
G.711alaw 160/320 20ms/40ms
G.711ulaw 160/320 20ms/40ms
G.726 80 40ms
G.729 10 10ms
G.729a 10 10ms
G.729b 10 10ms
PCM 1920 None
ADPCM 80 20ms
Opus 32/64 20ms/40ms
```
It supports the two-way audio mode or sending only mode (the platform only call PUT
```
```
/ISAPI/System/TwoWayAudio/channels/<audioID>/audioData to send the audio data to devices).
```
The <audioID> in step 3, 4, 5, 6, and 7 is the two-way audio channel No. which starts from 1. It can be parsed from
the <id> in the device response message of the step 2.
The audio type <audioCompressionType>, frame rate <audioBitRate>, and sampling rate <audioSamplingRate>
can be parsed from the device response message of the step 2 for audio playing and collection in the step 5 and 6.
The step 6 and 7 use persistent connections. In the HTTP request headers, you don't need to set Content-Legth,
but need to set the Connection: keep-alive and Content-Type: application/octet-stream.
When the encoding format of audio data in the step 5 and 6 is AAC/MP2L2/MP3, the audio data length is variable,
so the frame header should be lengthened by 4 bytes. When the encoding format is
G.722.1/G.711alaw/G.711ulaw/G.726/G.729/G.729a/G.729b/PCM/ADPCM/Opus, the audio data length is fixed,
there is no need to lengthen the frame header. For example, if the content length of a frame of MP3 audio data is
576 bytes and the header length is 4 bytes, the big end data is 0x00000240, the total length is 580 bytes.
The damaged audio file in the AC3 format is usually incompatible when using. Currently, the audio algorithm
library does not support this format.
8.1.3 Exception Handling
8.1.3.1 Error Codes
Hikvision co MMC
adil@hikvision.co.az
statusCode statusString subStatusCode errorCode errorMsg Description Remarks
4 InvalidOperation twoWayAudioInProgressPleaseWait 0x40002068
Two-way audio
in
progress...Please
wait.
Two-way audio
in
progress...Please
wait.
The
operation
is not
allowed.
Two-way
audio is
in
progress.
Please try
again
after
two-way
audio
stopped.
GET /ISAPI/System/TwoWayAudio/channels/1/audioData HTTP/1.1
```
Host: 10.17.115.128
```
```
Connection: keep-alive
```
Content-Type: application/octet-stream
HTTP/1.1 200 OK
```
Connection: keep-alive
```
Content-Type: application/octet-stream
//The following are the two-way audio data sent by the device.
PUT /ISAPI/System/TwoWayAudio/channels/1/audioData HTTP/1.1
```
Host: 10.17.115.128
```
```
Connection: keep-alive
```
Content-Type: application/octet-stream
//The following are the two-way audio data sent by the client.
Enable or disable the multi-door interlocking function, and configure the multi-door interlocking group parameters.
8.1.4 Message Format and Example
8.1.4.1 Receive Two-Way Audio Data
8.1.4.2 Send Two-Way Audio Data
```
9 Access Control (General)
```
9.1 . Configure Multi-Door Interlocking
9.1.1 Introduction to the Function
9.1.2 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az
API Calling Flow: ISAPI protocol interaction flow: 1.Get access control capability: GET
/ISAPI/AccessControl/capabilities. If the isSupportMultiDoorInterLockCfg field is true, it indicates the support for
```
configuring multi-door interlocking parameters; 2. Get the capability of configuring multi-door interlocking parameters:
```
GET /ISAPI/AccessControl/MultiDoorInterLockCfg/capabilities?format=json. 3. Get multi-door interlocking
```
parameters: GET /ISAPI/AccessControl/MultiDoorInterLockCfg?format=json; configure multi-door interlocking
```
```
parameters: PUT /ISAPI/AccessControl/MultiDoorInterLockCfg?format=json.
```
Anti-passback function allows person to pass entrance and exit by specific route. For areas with multiple entrance/exit,
person need to authenticate and pass specific doors. Only one time of authentication and passing is allowed for each
door, that is the person need to follow the specific order to pass the doors. Stand-alone anti-passback is designed to
minimize the misuse or fraudulent use of access credentials such as passing back card to an unauthorized person, or
tailed access. It is applicable to exhibitions, scenic spots, or metro entrances where one card one person is required.
Calling Flow:
9.2 . Configure Parameters of Stand-Alone Anti-Passback
9.2.1 Introduction to the Function
9.2.2 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az
ISAPI Protocol Calling Flow:
1. 1. Get the capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportAntiSneakCfg is returned and its value is "true", it indicates that the device supports configuring
Hikvision co MMC
adil@hikvision.co.az
```
Note: clear the historic anti-passback parameters before configuring new parameters.
```
Configurations related with access point unit, including door parameters configuration, secure door control unit
configuration, and configuration of access devices linked to the access point.
1. Get access control capability: /ISAPI/AccessControl/capabilities. If the node isSupportDoorCfg exists and is true,
it means the device supports door parameters configuration. If the node isSupportSearchDoorParams exists and is true,
it means the device supports searching for door parameters.
2. Get the parameters of the specified door: GET /ISAPI/AccessControl/Door/param/<doorID>?security=
```
<security>&iv=<iv>; configure the parameters of the specified door, such as the type of magnetic contact, exit button
```
type, and door opening duration: PUT /ISAPI/AccessControl/Door/param/<doorID>?security=<security>&iv=<iv>.
Batch configure door parameters: PUT /ISAPI/AccessControl/Door/Param?format=json&security=<security>&iv=
<iv>. Supports configuring all doors' parameters, and configuring door parameters by door No. list or by area. Get
door parameter capability: GET /ISAPI/AccessControl/Door/param/<doorID>/capabilities.
3. Search door parameters: POST /ISAPI/AccessControl/Door/SearchParams?format=json. Get the capability of
searching door parameters: GET /ISAPI/AccessControl/Door/SearchParams/capabilities?format=json.
parameters of stand-alone anti-passback.
2. Get the parameters of anti-passback configuration: GET /ISAPI/AccessControl/AntiSneakCfg?format=json; Set
```
the anti-passing back parameters: PUT /ISAPI/AccessControl/AntiSneakCfg?format=json; enable the anti-
```
```
passback function and the first card reader (first entrance), see details in GET
```
/ISAPI/AccessControl/AntiSneakCfg/capabilities?format=json.
3. Get the capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportCardReaderAntiSneakCfg is returned and its value is "true", it indicates that the device supports
configuring parameters of card readers.
4. Get the anti-passing back configuration parameters of a specified card reader: GET
```
/ISAPI/AccessControl/CardReaderAntiSneakCfg/<cardReaderID>?format=json; Set anti-passing back
```
parameters of a card reader: PUT /ISAPI/AccessControl/CardReaderAntiSneakCfg/<cardReaderID>?
```
format=json; the node cardReaderID refers to the card reader No. The person's passing route will follow the card
```
reader No. in the API. Note: the anti-passback route should be closed-loop. Improper configuration will affect
normal door opening. For example: card reader 1 -> card reader 2 -> card reader 3. The card reader 1 should be
set after card reader 3, or authentication in card reader 1 after one loop will fail. Get the configuration capability of
anti-passing back parameters of card readers: GET
/ISAPI/AccessControl/CardReaderAntiSneakCfg/capabilities?format=json.
5. Get the capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportClearAntiSneakCfg is returned and its value is "true", it indicates that the device supports clearing
parameters of anti-passback.
6. Clear anti-passing back parameters: PUT /ISAPI/AccessControl/ClearAntiSneakCfg?format=json; Get the
capability of clearing anti-passback parameters: GET /ISAPI/AccessControl/ClearAntiSneakCfg/capabilities?
```
format=json, set the value of antiSneak to false to disable the anti-passback function.
```
7. Get the capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportClearAntiSneak is returned and its value is "true", it indicates that the device supports clearing records of
anti-passback.
8. Clear anti-passback records in the device: PUT /ISAPI/AccessControl/ClearAntiSneak?format=json; It supports
clearing anti-passback records by person ID. Get the capability of clearing anti-passback records: GET
/ISAPI/AccessControl/ClearAntiSneak/capabilities?format=json.
9.3 Access Point Unit Management
9.3.1 Introduction to the Function
9.3.2 API Calling Flow
9.3.2 Door Parameter Configuration
Hikvision co MMC
adil@hikvision.co.az
Secure door control unit is connected to access control devices via RS485 to access locks, preventing illegal persons
from damaging the access control devices and replacing them with other access control devices, which may cause
owner to lose access control permissions. The pairing mechanism ensures that the secure door control unit can only be
controlled and used by the unique-paired access control device. 2. Exit button can unpair the access control device and
secure door control unit.
1. Get access control capability: /ISAPI/AccessControl/capabilities. If the node
isSupportDoorSecurityModulePairParams exists and is true, it indicates that the device supports the function.
2. Get the pairing parameters of secure door control unit: GET
/ISAPI/AccessControl/Door/DoorSecurityModulePairParams?format=json. Set the parameters to control the
enabling status of the pairing function: PUT /ISAPI/AccessControl/Door/DoorSecurityModulePairParams?
```
format=json. Get the capability of configuring the pairing parameters of secure door control unit: GET
```
/ISAPI/AccessControl/Door/DoorSecurityModulePairParams/capabilities?format=json.
This function is for connecting multiple secure door control units to an access control device, so as to configure the
doors of secure door control units.
1. Get access control capability: /ISAPI/AccessControl/capabilities. If the node
isSupportDoorSecurityModuleSwitchParams exists and is true, it indicates that the device supports the function.
2. Get the switch parameters of secure door control unit: GET
```
/ISAPI/AccessControl/Door/DoorSecurityModuleSwitchParams?format=json; configure parameters to switch the
```
doors accessed by secure door control unit: PUT /ISAPI/AccessControl/Door/DoorSecurityModuleSwitchParams?
```
format=json. Get the switch parameter capability of secure door control unit: GET
```
/ISAPI/AccessControl/Door/DoorSecurityModuleSwitchParams/capabilities?format=json.
1. Get access control capability: /ISAPI/AccessControl/capabilities. If the node isSupportModuleStatus exists and
is true, it indicates that the device supports the function.
2. Get secure door control unit status: GET /ISAPI/AccessControl/DoorSecurityModule/moduleStatus. Get parameter
capability of secure door control unit status: GET
/ISAPI/AccessControl/DoorSecurityModule/moduleStatus/capabilities.
1. Get access control capability: /ISAPI/AccessControl/capabilities. If the node isSupportLockTypeCfg exists and is
true, it indicates that the device supports the function.
2. Get the parameters of the door lock status when the device is powered off: GET
```
/ISAPI/AccessControl/Configuration/lockType?format=json&doorID=<doorID>; Configure the lock status when the
```
device is powered off: PUT /ISAPI/AccessControl/Configuration/lockType?format=json&doorID=<doorID>. Get the
capability of configuring the door lock status when the device is powered off: GET
/ISAPI/AccessControl/Configuration/lockType/capabilities?format=json.
1. Get access control capability: /ISAPI/AccessControl/capabilities. If the node
isSupportDoorMagneticDefiniteRule exists and is true, it indicates that the device supports the function.
2. Get the definition rule of magnetic contact status: GET /ISAPI/AccessControl/doorMagneticDefiniteRule?
```
format=json; set the definition rule of magnetic contact status: PUT
```
/ISAPI/AccessControl/doorMagneticDefiniteRule?format=json. Get the capability of the definition rule of magnetic
contact status: GET /ISAPI/AccessControl/doorMagneticDefiniteRule/capabilities?format=json.
9.3.2.2 Pairing Parameters of Secure Door Control Unit
9.3.2.3 Switch Parameters of Secure Door Control Unit
9.3.2.4 Get Secure Door Control Unit Status
9.3.2.5 Parameters of Door Lock Status When Powered Off
9.3.2.6 Definition Rule of Magnetic Contact Status
9.3.2.7 Parameters Configuration of Unlocking Door
Hikvision co MMC
adil@hikvision.co.az
The decoder’s web client supports unlocking the door station, including lock 1, lock 2, and lock 1 and lock 2. Application
```
scenario: When the door station initiates a call to the analog handset, after the analog handset dials in, the door station
```
can start two-way audio communication with the 2-wire analog handset. After the analog handset dials in and sends
signaling to the decoder, the decoder unlocks the door station by sending the lock ID.
1. Get access control capability: /ISAPI/AccessControl/capabilities. If the node isSupportOpenDoorParams exists
and is true, it indicates that the device supports the function.
2. Get door-open parameters: GET /ISAPI/AccessControl/Door/OpenDoorParams?format=json; set door-open
```
parameters: PUT /ISAPI/AccessControl/Door/OpenDoorParams?format=json 3. Get the capability of configuring the
```
parameters of unlocking doors: GET /ISAPI/AccessControl/Door/OpenDoorParams/capabilities?format=json.
1. Get access control capability: /ISAPI/AccessControl/capabilities. If isSupportGetSmartLockParam and
isSupportWorkStatus exist and the value is true, it indicates the support for getting smart lock information list and lock
status.
2. Get the list of smart lock information: GET /ISAPI/VideoIntercom/SmartLock/lockParam. Get the capability of smart
lock information list: GET /ISAPI/VideoIntercom/SmartLock/lockParam/capabilities.
3. Get lock status: GET /ISAPI/VideoIntercom/WorkStatus.
Configure access devices linked to access point, including but not limited to card readers, doorbells, door locks, exit
buttons, and relays. Supports binding and unbinding access devices.
1. Get access control capability: /ISAPI/AccessControl/capabilities. If isSupportDoorLinkageDeviceParams、
isSupportGetDoorLinkageDeviceNum、isSupportSearchAvailableLinkageDoor、isSupportDoorLinkageDevice、
isSupportOneKeyUnbindDoorLinkageDevice、isSupportSearchDoorLinkageDeviceList is true, it indicates that the
device supports getting the parameters and number of access devices linked to access points, searching for the
information of doors which can be linked to access device, configuring and quickly unkinking access devices, and
searching for the list of access devices linked to access points.
2. Get the parameters of access device linked to access point: GET
/ISAPI/AccessControl/Door/DoorLinkageDeviceParams?format=json. It can be used to determine the supported
number of access devices which can be linked to single access point.
3. Get the number of access devices linked to access points: POST
/ISAPI/AccessControl/Door/GetDoorLinkageDeviceNum?format=json. It can be used to search for the number of
```
access devices (abnormal ones included) linked to the door. Get parameter capability of the number of access devices
```
linked to the access point: GET /ISAPI/AccessControl/Door/GetDoorLinkageDeviceNum/capabilities?format=json.
4. Search for the list of access devices linked to the access point: GET
/ISAPI/AccessControl/Door/door/<doorID>/SearchDoorLinkageDeviceList?format=json.
5. Configure access devices linked to the access point: PUT
/ISAPI/AccessControl/Door/door/<doorID>/DoorLinkageDevice?format=json. It can be used to link or unlink access
devices. Get the parameter capability of access devices linked to the access point: GET
/ISAPI/AccessControl/Door/door/<doorID>/DoorLinkageDevice/capabilities?format=json.
6. Supports quickly unlinking the access devices with the access point: PUT
/ISAPI/AccessControl/Door/door/<doorID>/OneKeyUnbindDoorLinkageDevice?format=json.
7. Search for the information of doors which can be linked to access device: POST
/ISAPI/AccessControl/Door/SearchAvailableLinkageDoor?format=json. Get parameter capability of searching for
the information of doors which can be linked to access device: **** GET
/ISAPI/AccessControl/Door/SearchAvailableLinkageDoor/capabilities?format=json.
The device supports getting the arming information, such as the armed device IP and port, arming type, and protocol
9.3.2.8 Get Lock Parameters
9.3.2.9 Access Devices Linked to Access Point
9.4 Arming Information
9.4.1 Introduction to the Function
Hikvision co MMC
adil@hikvision.co.az
type.
By calling the following APIs, the entrance&exit time schedule and authentication mode can be applied to the card
reader. An access control terminal is controlled by two card readers. For example: access control terminal 1 is controlled
```
by entrance card reader 1 and exit card reader 2; access control terminal 2 is controlled by entrance card reader 3 and
```
exit card reader 4, etc. Card reader n is corresponding to schedule template n.
1 weekly schedule and 4 holiday groups can be added in each schedule template. The priority of holiday schedule is
higher than that of weekly schedule. A weekly schedule can be configured by date of a week and 8 different time
periods of a day. 16 holiday schedules can be added to a holiday group schedule. Each holiday schedule has its start
```
and end date, and the time period is same in the range (8 time periods can be added). The access control can follow the
```
schedule template to manage the time of person's permissions.
For Person Management of Person and Credential Management, the priority of the authentication method for person is
```
higher than that of the authentication schedule. If the authentication method (the node is userVerifyMode) is applied to
```
a person, the person can access according to the authentication method for person.
9.4.2 API Calling Flow
1. Get the functional capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportDeployInfo is returned and its value is "true", it indicates that the device supports getting arming
information.
2. Get arming information capability: GET /ISAPI/AccessControl/DeployInfo/capabilities.
3. Get arming information: GET /ISAPI/AccessControl/DeployInfo.
9.5 Authentication Schedule Management
9.5.1 Introduction to the Function
9.5.2 API Calling Flow
9.5.2.1 Card Reader's Authentication Schedule Configuration
Hikvision co MMC
adil@hikvision.co.az
The API calling flow is as follows:
1. Check whether the device supports configuring control schedules of card reader authentication mode: GET
```
/ISAPI/AccessControl/capabilities; if the node isSupportCardReaderPlan is returned and its value is "true", it
```
```
indicates that the device supports configuring acontrol schedules of card reader authentication mode (and the
```
```
device also supports configuring schedule templates of the card reader authentication mode).
```
2. Set control schedule parameters of card reader authentication mode: [GET/PUT]
```
/ISAPI/AccessControl/CardReaderPlan/<cardReaderID>?format=json; the value of cardReaderID should be the
```
same as the value of templateNo.
3. If the node isSupportCardReaderPlan is returned and its value is "false", it indicates that the device does not
support configuring control schedules of card reader authentication mode.
9.5.2.2 Authentication Schedule Template Configuration
Hikvision co MMC
adil@hikvision.co.az
The API calling flow is as follows:
1. Check whether the device supports configuring schedule templates of the card reader authentication mode: GET
```
/ISAPI/AccessControl/capabilities; if the node isSupportVerifyPlanTemplate is returned and its value is "true",
```
```
it indicates that the device supports configuring schedule templates of the card reader authentication mode (and
```
```
the device also supports configuring weekly schedules of the card reader authentication mode).
```
2. Set the schedule template parameters of the card reader authentication mode: [GET/PUT]
/ISAPI/AccessControl/VerifyPlanTemplate/<planTemplateID>?format=json.
3. If the node isSupportVerifyPlanTemplate is returned and its value is "false", it indicates that the device does not
support configuring schedule templates of the card reader authentication mode.
9.5.2.3 Weekly Authentication Schedule Template Configuration
Hikvision co MMC
adil@hikvision.co.az
The API calling flow is as follows:
1. Check whether the device supports configuring weekly schedules of the card reader authentication mode: GET
```
/ISAPI/AccessControl/capabilities; if the node isSupportCardRightWeekPlanCfg is returned and its value is
```
"true", it indicates that the device supports configuring weekly schedules of the card reader authentication mode.
2. Set the weekly schedule parameters of the card reader authentication mode: [GET/PUT]
/ISAPI/AccessControl/VerifyWeekPlanCfg/<weekPlanID>?format=json.
3. If the node isSupportVerifyWeekPlanCfg is returned and its value is "false", it indicates that the device does not
support configuring weekly schedules of the card reader authentication mode.
9.5.2.4 Holiday Authentication Group Configuration
Hikvision co MMC
adil@hikvision.co.az
The API calling flow is as follows:
1. Check whether the device supports configuring holiday groups of control schedule of card reader authentication
```
mode: GET /ISAPI/AccessControl/capabilities; if the node isSupportVerifyHolidayGroupCfg is returned and its
```
value is "true", it indicates that the device supports configuring holiday groups of control schedule of card reader
```
authentication mode (and the device also supports configuring holiday schedules of card reader authentication
```
```
mode).
```
2. Set holiday group parameters of control schedule of card reader authentication mode: [GET/PUT]
/ISAPI/AccessControl/VerifyHolidayGroupCfg/<holidayGroupID>?format=json.
3. If the node isSupportVerifyHolidayGroupCfg is returned and its value is "false", it indicates that the device does not
support configuring holiday groups of control schedule of card reader authentication mode.
9.5.2.5 Holiday Authentication Schedule Configuration
Hikvision co MMC
adil@hikvision.co.az
The API calling flow is as follows:
1. Check whether the device supports configuring holiday schedules of card reader authentication mode: GET
```
/ISAPI/AccessControl/capabilities; if the node isSupportVerifyHolidayPlanCfg is returned and its value is
```
"true", it indicates that the device supports configuring holiday schedules of card reader authentication mode.
2. Set holiday schedule parameters of card reader authentication mode: [GET/PUT]
/ISAPI/AccessControl/VerifyHolidayPlanCfg/<holidayPlanID>?format=json.
3. If the node isSupportVerifyHolidayPlanCfg is returned and its value is "false", it indicates that the device does not
support configuring holiday schedules of card reader authentication mode.
9.6 Authentication via QR Code
9.6.1 Generate QR Code by Platform
9.6.1.1 Introduction to the Function
Hikvision co MMC
adil@hikvision.co.az
1. After an access control device is deployed, you should add it to the platform and set the QR code key which will be
saved to the database of the platform. Notes: For security, the QR code key should be encrypted before been
```
saved to the platform and the device; if you need to open multiple doors by scanning the QR codes, the
```
device key of the multiple doors should be the same.
2. The platform applies persons' permissions to the device via person-based function. The QR code is linked with
employee No., so the permission of opening a door is decided by whether a person's employee No. is
authenticated.
3. Before entering the controlled areas, the visitors need to register on the platform. The platform will generate QR
code strings according to the registered information, QR code key, and QR code protocol, for converting QR code
strings to QR code pictures, and sending to visitors' phones.
4. When the visitors enter the controlled areas, they can scan the QR codes via the devices. Then, the device can get
the encrypted data, decrypt the data by QR code key and protocol, and check whether the door can be opened. If
```
yes, the door will open; if no, the door will not open and the device will prompt the message "No permission".
```
9.6.1.2 API Calling Flow
1. Get the functional capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportQRCodeEncryption is returned and its value is "true", it indicates that the device supports QR code
encryption.
2. Get the capability of QR code encryption: GET /ISAPI/AccessControl/QRCodeEncryption/capabilities?
```
format=json.
```
3. Set the parameters of QR code encryption: PUT /ISAPI/AccessControl/QRCodeEncryption?
```
format=json&security=<security>&iv=<iv>, the parameters include encryption type, encryption key, and
```
initialization vector.
4. Get the related APIs of Person and Credential Management for applying certain persons' permissions to open the
doors. So the permission of opening a door is decided by whether a person's employee No. is authenticated.
5. After generating QR code strings by Base64 and generating QR code pictures based on QR code strings, the
platform for sending the pictures to visitors' phones. The visitors can access the area after scanning the QR code
pictures.
9.6.2 Generate QR Code by Device
9.6.2.1 Introduction to the Function
1. After an access control device is deployed, you can log in to the device via the Web / iVMS-4200 client software,
Hikvision co MMC
adil@hikvision.co.az
```
The device will send AccessControllerEvent (contains QRCodeInfo) for QR code authentication. If the authentication
```
succeed, the returned event type will be 0x9c, if the authentication failed, the returned event type will be 0x9d.
Card management includes searching, applying, adding, editing, deleting, and collecting cards.
```
and set a QR code key for the device (saving the QR code key is not necessary). Notes: to ensure security, the
```
```
QR code key should be encrypted before saving to the device; if multiple doors need to be opened via
```
the QR code, the devices of the multiple doors should be configured a same key.
2. By calling the APIs of person-based functions, the Web / iVMS-4200 client software applies persons' permission to
the device. So the permission of opening a door is decided by whether a person's employee No. is authenticated.
3. Before visitors enter the controlled areas, the inviters need to upload the visitor information to EZ and apply the
information to the device. The device will generate QR code strings according to the visitor information, QR code
key, and QR code protocol, and send back to the inviters. The inviters' phones will convert QR code strings to QR
code pictures, and forward the pictures to visitors' phones.
4. When the visitors enter the controlled areas, they can scan the QR codes via the devices. Then, the device can get
the encrypted data, decrypt the data by QR code key and protocol, and check whether the door can be opened. If
```
yes, the door will open; if no, the door will not open and prompt the message "No permission". Note: for
```
usability and security, APIs of generating QR codes by the platform are not accessible, only APIs of
generating QR code by device are provided.
9.6.2.2 API Calling Flow
1. Get the functional capability of access control: GET /ISAPI/AccessControl/capabilities; if the nodes
isSupportQRCodeEncryption and isSupportQRCodeInfo are returned and the value is "true", it indicates that the
device supports QR code encryption and generating QR code.
2. Get the capability of QR code encryption: GET /ISAPI/AccessControl/QRCodeEncryption/capabilities?
```
format=json. Get the capability of generating QR code: GET /ISAPI/AccessControl/QRCodeInfo/capabilities?
```
```
format=json.
```
3. Set the parameters of QR code encryption: PUT /ISAPI/AccessControl/QRCodeEncryption?
```
format=json&security=<security>&iv=<iv>, the parameters include encryption type, encryption key, and
```
initialization vector.
4. Get the related APIs of Person and Credential Management for applying certain persons' permissions to open the
doors. The permission of opening a door will be decided by whether a person's employee No. is authenticated.
5. Generate QR code strings encoded via base64: POST /ISAPI/AccessControl/QRCodeInfo?format=json&security=
```
<security>&iv=<iv>; then the device will send the QR code strings to the phones of the inviters.
```
6. Inviters' phones convert the QR code strings to QR code pictures, and send to visitors' phones.
7. The visitors can access the area by scanning the QR code pictures in their phones.
9.6.3 Remarks
9.7 Card Management
9.7.1 Introduction to the Function
Hikvision co MMC
adil@hikvision.co.az
Before calling the API for card management, make sure that the device supports card management.
```
Note:
```
9.7.2 API Calling Flow
9.7.2.1 Check Whether the Device Supports Card Management
1. Check whether the device supports card management: GET /ISAPI/AccessControl/capabilities; if the node
isSupportCardInfo is returned and its value is “true”, it indicates that the device supports card management.
2. Search, apply, add, edit, and delete cards.
3. If the node isSupportCardInfo is returned and its value is “false”, it indicates that the device does not support card
management.
Before applying, adding, or editing cards on the device, make sure that the related person information linked to the
person ID has been applied to the device.
The value of the node numberPerPerson returned by calling GET
/ISAPI/AccessControl/CardInfo/capabilities?format=json is the maximum number of cards supported per
person. If the value returned is 255, it indicates that the number of cards per person is unlimited. If the node is not
returned, it indicates that the maximum number of cards can be applied is 5.
Manage cards of different card number lengths by calling [GET/PUT]
/ISAPI/AccessControl/CardVerificationRule?format=json.
Hikvision co MMC
adil@hikvision.co.az
9.7.2.2 Card Search
Hikvision co MMC
adil@hikvision.co.az
The card search function is for searching the number of cards and card information applied to the device.
Hikvision co MMC
adil@hikvision.co.az
```
Note:
```
The value of the node maxRecordNum returned by calling GET /ISAPI/AccessControl/CardInfo/capabilities?
```
format=json is the maximum number of cards supported by the device.
```
1. Check whether the device supports card search: GET /ISAPI/AccessControl/CardInfo/capabilities?
```
format=json; if the value of the node supportFunction contains “get”, it indicates that the device supports card
```
search.
2. Search the number of specified persons’ cards: GET /ISAPI/AccessControl/CardInfo/Count?
```
format=json&employeeNo=<employeeNo>; the returned value of the node cardNumber is the number of the cards
```
added to the specified persons.
3. Search the number of all persons’ cards: GET /ISAPI/AccessControl/CardInfo/Count?format=json; the returned
value of the node cardNumber is the number of the cards added to all persons.
4. Search card information: POST /ISAPI/AccessControl/CardInfo/Search?format=json; the card information is
returned by page.
5. If the value of the node supportFunction does not contain “get”, it indicates that the device does not support card
search.
9.7.2.3 Card Applying
Hikvision co MMC
adil@hikvision.co.az
Card information can be applied to the device via the card applying function. If the card has been added to
```
the device, the card information will be edited; if the card has not been added to the device, the card
```
information will be added to the device.
```
Note:
```
Check whether the card has been added to the device via the node cardNo returned after calling the API for card
applying.
1. Check whether the device supports card applying: GET /ISAPI/AccessControl/CardInfo/capabilities?
```
format=json; if the value of the node supportFunction contains “setUp”, it indicates that the device supports card
```
applying.
2. Apply card information: PUT /ISAPI/AccessControl/CardInfo/SetUp?format=json.
3. If the value of the node supportFunction does not contain “setUp”, it indicates that the device does not support
card applying.
9.7.2.4 Card Adding
Hikvision co MMC
adil@hikvision.co.az
Card information can be added to the device via the card adding function. If the card has been added to the
```
device, the device will report an error; if the card has not been added to the device, the card information will
```
be added to the device.
```
Note:
```
Check whether the card has been added to the device via the node cardNo returned after calling the API for card
adding.
1. Check whether the device supports card adding: GET /ISAPI/AccessControl/CardInfo/capabilities?
```
format=json; if the value of the node supportFunction contains “post”, it indicates that the device supports card
```
adding.
2. Add card information: POST /ISAPI/AccessControl/CardInfo/Record?format=json.
3. If the value of the node supportFunction does not contain “post”, it indicates that the device does not support card
adding.
9.7.2.5 Card Information Editing
Hikvision co MMC
adil@hikvision.co.az
Card information on the device can be edited via the card information editing function. If the card has been
```
added to the device, the card information will be edited; if the card has not been added to the device, the
```
device will report an error.
```
Note:
```
Check whether the card has been added to the device via the node cardNo returned after calling the API for card
information editing.
1. Check whether the device supports card information editing: GET
```
/ISAPI/AccessControl/CardInfo/capabilities?format=json; if the value of the node supportFunction contains
```
“put”, it indicates that the device supports card information editing.
2. Edit card information: PUT /ISAPI/AccessControl/CardInfo/Modify?format=json.
3. If the value of the node supportFunction does not contain “put”, it indicates that the device does not support card
information editing.
9.7.2.6 Card Deleting
Hikvision co MMC
adil@hikvision.co.az
The card information on the device can be deleted via the card deleting function. The device will not report
an error if the card information to be deleted is not added to the device.
1. Check whether the device supports card deleting: GET /ISAPI/AccessControl/CardInfo/capabilities?
```
format=json; if the value of the node supportFunction contains “delete”, it indicates that the device supports card
```
deleting.
2. Delete cards: PUT /ISAPI/AccessControl/CardInfo/Delete?format=json; if calling succeeded, it indicates that the
device has deleted the cards.
3. If the value of the node supportFunction does not contain “delete”, it indicates that the device does not support
card deleting.
9.7.2.7 Card Collecting
Hikvision co MMC
adil@hikvision.co.az
The card collecting function is for collecting the card No., card type, etc.
Non-anti-passback time period: anti-passback is not triggered in the set time period. Application Scenarios: In rush
hour, anti-passback can always happens since the person might follow others in the people flow. Non-anti-passback
can help normal entry&exit in rush hour.
Calling Flow:
1. Check whether the device supports card collecting: GET /ISAPI/AccessControl/capabilities; if the node
isSupportCaptureCardInfo is returned and its value is “true”, it indicates that the device supports card collecting.
2. Collect card information: GET /ISAPI/AccessControl/CaptureCardInfo?format=json.
3. If the node isSupportCaptureCardInfo is returned and its value is “false”, it indicates that the device does not
support card collecting.
9.8 Configure Non-anti-passback Time Period
9.8.1 Introduction to the Function
9.8.2 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az
ISAPI Protocol Calling Flow:
For doors of access control or floors of elevator control, you can set schedule templates. The schedule template
```
information include time period and status (remain open, remain closed, sleep, and normal). Configuring door control
```
schedule is not required. If it is not configured, No device configuration has permission for all the doors by default. The
priority of remote door control is higher than that of door control schedule. The operation of remote door control can
take effect when the door is in the status of remain open/closed, sleep, and normal.
Each schedule template can be linked to one week schedule and four holiday group schedules. Holiday schedule
priority is higher than that of weekly schedule. Weekly schedule can be configured with time periods from Monday to
Sunday, and 8 different time periods are supported each day. Holiday group schedule can be linked to 16 different
holiday schedules. Each holiday schedule can be configured with one start and end date of the holiday, and the access
```
time period is the same for each day (up to 8 different time periods can be configured). This schedule template is
```
configured to manage access control permission.
1. Get the capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportAntiPassbackTimeRange is returned and its value is "true", it indicates that the device supports
configuring time period of anti-passback.
2. Get time period parameters of non anti-passback: GET /ISAPI/AccessControl/AntiPassback/timeRange?
```
format=json; configure time period parameters of non anti-passback: PUT
```
```
/ISAPI/AccessControl/AntiPassback/timeRange?format=json; it can specify the time period of anti-passback;
```
Get the capacity of configuring time period of anti-passback: GET
/ISAPI/AccessControl/AntiPassback/timeRange/capabilities?format=json.
9.9 Door Control Schedule Management
9.9.1 Introduction to the Function
Hikvision co MMC
adil@hikvision.co.az
The API calling flow is as follow:
9.9.2 API Calling Flow
9.9.2.1 Configure Door Control Schedule
1. Check whether the device supports configuring door control schedule: GET /ISAPI/AccessControl/capabilities;
if the node isSupportDoorStatusPlan is returned and its value is "true", it indicates that the device supports
Hikvision co MMC
adil@hikvision.co.az
The API calling flow is as follow:
```
configuring door control schedule (and the device also supports configuring schedule template of door control).
```
2. Set door control schedule: [GET/PUT] /ISAPI/AccessControl/DoorStatusPlan/<doorID>?format=json.
3. If the node isSupportDoorStatusPlan is returned and its value is "false", it indicates that the device does not
support configuring door control schedule.
9.9.2.2 Configure Door Control Schedule Template
1. Check whether the device supports configuring door control schedule template:GET
```
/ISAPI/AccessControl/capabilities; if the node isSupportDoorStatusPlanTemplate is returned and its value is
```
```
"true", it indicates that the device supports configuring door control schedule template (and the device should also
```
```
supports configuring door status schedule template).
```
2. Get and set parameters of door control schedule template: [GET/PUT]
/ISAPI/AccessControl/DoorStatusPlanTemplate/<planTemplateID>?format=json.
3. If the node isSupportDoorStatusPlanTemplate is returned and its value is "false", it indicates that the device does
not support configuring door control schedule template.
9.9.2.3 Configure Door Control Weekly Schedule
Hikvision co MMC
adil@hikvision.co.az
The API calling flow is as follow:
1. Check whether the device supports configuring door control weekly schedule: GET
```
/ISAPI/AccessControl/capabilities; if the node isSupportDoorStatusWeekPlanCfg is returned and its value is
```
"true", it indicates that the device supports this function.
2. Set parameters of door control weekly schedule: [GET/PUT]
/ISAPI/AccessControl/DoorStatusWeekPlanCfg/<weekPlanID>?format=json.
3. If the node isSupportDoorStatusWeekPlanCfg is returned and its value is "false", it indicates that the device does
not support configuring this function.
9.9.2.4 Configure Door Control Holiday Group
Hikvision co MMC
adil@hikvision.co.az
The API calling flow is as follow:
1. Check whether the device supports configuring door control holiday group: GET
```
/ISAPI/AccessControl/capabilities; if the node isSupportDoorStatusHolidayGroupCfg is returned and its value
```
```
is "true", it indicates that the device supports configuring door control holiday group (and the device also supports
```
```
configuring door control holiday schedule).
```
2. Set the holiday group configuration parameters of the door control schedule: [GET/PUT]
/ISAPI/AccessControl/DoorStatusHolidayGroupCfg/<holidayGroupID>?format=json.
3. If the node isSupportDoorStatusHolidayGroupCfg is returned and its value is "false", it indicates that the device
does not support this function.
9.9.2.5 Configure Door Control Holiday Schedule
Hikvision co MMC
adil@hikvision.co.az
The API calling flow is as follow:
The device supports linking specific actions when access control events triggered. The linkage actions include event,
card No., MAC address, and employee No. Take event for example, if a person authenticated by the device, the door will
open for the person.
1. Check whether the device supports configuring door control holiday schedule: GET
```
/ISAPI/AccessControl/capabilities; if the node isSupportDoorStatusHolidayPlanCfg is returned and its value is
```
"true", it indicates that the device supports this function.
2. Set parameters of door control holiday schedule: [GET/PUT]
/ISAPI/AccessControl/DoorStatusHolidayPlanCfg/<holidayPlanID>?format=json.
3. If the node isSupportDoorStatusHolidayPlanCfg is returned and its value is "false", it indicates that the device does
not support this function.
9.10 Event and Card Linkage Parameters
9.10.1 Introduction to the Function
9.10.2 API Calling Flow
9.10.2.1 Configure Parameters of Event and Card Linkage
Hikvision co MMC
adil@hikvision.co.az
Face picture management includes searching, applying, adding, editing, deleting, and collecting face pictures.
1. Get the functional capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportEventCardLinkageCfg is returned and its value is "true", it indicates that the device supports configuring
the parameters of event and card linkage.
2. Get the configuration capability of the event and card linkage: GET
/ISAPI/AccessControl/EventCardLinkageCfg/capabilities?format=json.
3. Get and set the parameters of event and card linkage: GET|PUT
/ISAPI/AccessControl/EventCardLinkageCfg/<ACEID>?format=json.
9.10.2.2 Search for Parameters of Event and Card Linkage
1. Get the functional capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportEventCardLinkageCfgSearch is returned and its value is "true", it indicates that the device supports
searching for the parameters of event and card linkage.
2. Get the capability of searching for parameters of event and card linkage: GET
/ISAPI/AccessControl/EventCardLinkageCfg/search/capabilities?format=json.
3. Search for parameters of event and card linkage: POST /ISAPI/AccessControl/EventCardLinkageCfg/search?
```
format=json.
```
9.10.2.3 Delete Parameters of Specific Event and Card Linkage
1. Get the functional capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportEventCardLinkageCfgDelete is returned and its value is "true", it indicates that the device supports
deleting parameters of event and card linkage.
2. Delete parameters of specific event and card linkage: PUT /ISAPI/AccessControl/EventCardLinkageCfgDelete?
```
format=json.
```
9.10.2.4 Get List of Event and Card Linkage ID
1. Call the functional capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportEventCardNoList is returned and its value is true, it indicates that the device supports getting events and
the card linkage ID list.
2. Get the capability of the list of event and card linkage ID: GET
/ISAPI/AccessControl/EventCardNoList/capabilities?format=json.
3. Get the list of event and card linkage ID: GET /ISAPI/AccessControl/EventCardNoList?format=json.
9.10.2.5 Optimize Event
1. Get the functional capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
iisSupportEventOptimizationCfg is returned and its value is "true", it indicates that the device supports event
optimization.
2. Get the configuration capability of event optimization: GET
/ISAPI/AccessControl/EventOptimizationCfg/capabilities?format=json.
3. Get the event optimization configuration parameters: GET|PUT /ISAPI/AccessControl/EventOptimizationCfg?
```
format=json.
```
9.11 Face Picture Management
9.11.1 Introduction to the Function
Hikvision co MMC
adil@hikvision.co.az
Before calling the API for face picture management, make sure that the device supports face picture
management.
```
Note:
```
9.11.2 API Calling Flow
9.11.2.1 Check Whether the Device Supports Face Picture Management
1. Check whether the device supports face picture management: GET /ISAPI/AccessControl/capabilities; if the
node isSupportFDLib is returned and its value is “true”, it indicates that the device supports face picture
management.
2. Search, apply, add, edit, and delete face pictures.
3. If the node isSupportFDLib is returned and its value is “false”, it indicates that the device does not support face
picture management.
Before applying, adding, or editing face picture information on the device, make sure that the related person
information linked to the person ID has been applied to the device, and make sure that the device has its face
```
picture library by calling GET /ISAPI/Intelligent/FDLib?format=json (if the device has no face picture library,
```
```
then create the face picture library by calling POST /ISAPI/Intelligent/FDLib?format=json), and the ID of the
```
```
library of face pictures captured in visible light (FDID) is 1.
```
If the value of the node mode returned by calling GET /ISAPI/AccessControl/FaceRecognizeMode/capabilities?
```
format=json contains “deepMode”, it indicates that the device supports the deep mode, which compares face
```
Hikvision co MMC
adil@hikvision.co.az
```
pictures captured in infrared light. For devices which support the deep mode, if the face picture library ID (FDID) is
```
2, face pictures captured in infrared light will be applied to the face picture library and be used for face picture
```
comparison; if the face picture library ID (FDID) is 1, face pictures captured in visible light will be applied to the face
```
picture library and be displayed on the device.
Switch between the deep mode and normal mode: [GET/PUT] /ISAPI/AccessControl/FaceRecognizeMode?
```
format=json; the modes can be switched via the node mode.
```
9.11.2.2 Face Picture Search
Hikvision co MMC
adil@hikvision.co.az
The face picture search function is for searching the number of face pictures and face picture information
added to the device.
```
Note:
```
The value of the node FDRecordDataMaxNum returned by calling GET /ISAPI/Intelligent/FDLib/capabilities?
```
format=json is the maximum number of face pictures supported by the device.
```
1. Check whether the device supports face picture search: GET /ISAPI/Intelligent/FDLib/capabilities?
```
format=json; if the value of the node supportFunction contains “get”, it indicates that the device supports face
```
picture search.
2. Search the number of face pictures in the specified face picture libraries: GET /ISAPI/Intelligent/FDLib/Count?
```
format=json&FDID=<FDID>&faceLibType=<faceLibType>; the returned value of the node recordDataNumber is the
```
number of the added face pictures of the specified face picture libraries.
3. Search the number of face pictures in all face picture libraries: GET /ISAPI/Intelligent/FDLib/Count?
```
format=json; the returned value of the node recordDataNumber is the number of face pictures in all face picture
```
libraries.
4. Search face picture information: POST /ISAPI/Intelligent/FDLib/FDSearch?format=json; the face picture
information is returned by page.
5. If the value of the node supportFunction does not contain “get”, it indicates that the device does not support face
picture search.
9.11.2.3 Face Picture Applying
Hikvision co MMC
adil@hikvision.co.az
Face picture information can be applied to the device via the face picture applying function. If the face
```
picture has been added to the device, the face picture information will be edited; if the face picture has not
```
been added to the device, the face picture information will be added to the device.
```
Note:
```
Check whether the face picture has been added to the device via the node FPID returned by calling the API for face
picture applying, and link the face picture to the person information via the node FPID in face picture management and
the node employeeNo in person management.
1. Check whether the device supports face picture applying: GET /ISAPI/Intelligent/FDLib/capabilities?
```
format=json; if the value of the node supportFunction contains “setUp”, it indicates that the device supports face
```
picture applying.
2. Apply face picture information: PUT /ISAPI/Intelligent/FDLib/FDSetUp?format=json.
3. If the value of the node supportFunction does not contain “setUp”, it indicates that the device does not support face
picture applying.
9.11.2.4 Face Picture Adding
Hikvision co MMC
adil@hikvision.co.az
Face picture information can be added to the device via the face picture adding function. If the face picture
```
has been added to the device, the device will report an error; if the face picture has not been added to the
```
device, the face picture information will be added to the device.
```
Note:
```
Check whether the face picture has been added to the device via the node FPID returned by calling the API for face
picture adding, and link the face picture to the person information via the node FPID in face picture management and
the node employeeNo in person management.
1. Check whether the device supports face picture adding: GET /ISAPI/Intelligent/FDLib/capabilities?
```
format=json; if the value of the node supportFunction contains “post”, it indicates that the device supports face
```
picture adding.
2. Add face picture information: POST /ISAPI/Intelligent/FDLib/FaceDataRecord?format=json.
3. If the value of the node supportFunction does not contain “post”, it indicates that the device does not support face
picture adding.
9.11.2.5 Face Picture Information Editing
Hikvision co MMC
adil@hikvision.co.az
Face picture information on the device can be edited via the face picture information editing function. If the
```
face picture has been added to the device, the face picture information will be edited; if the face picture has
```
not been added to the device, the device will report an error.
```
Note:
```
Check whether the face picture has been added to the device via the node FPID returned by calling the API for face
picture information editing, and link the face picture to the person information via the node FPID in face picture
management and the node employeeNo in person management.
1. Check whether the device supports face picture information editing: GET
```
/ISAPI/Intelligent/FDLib/capabilities?format=json; if the value of the node supportFunction contains “put”,
```
it indicates that the device supports face picture information editing.
2. Edit face picture information: PUT /ISAPI/Intelligent/FDLib/FDModify?format=json.
3. If the value of the node supportFunction does not contain “put”, it indicates that the device does not support face
picture information editing.
Hikvision co MMC
adil@hikvision.co.az
The face picture information on the device can be deleted via the face picture deleting function. The device
will not report an error if the face picture to be deleted is not added to the device.
```
Note:
```
All the face picture libraries and the face picture information in the libraries on the device can be deleted by calling
DELETE /ISAPI/Intelligent/FDLib?format=json.
9.11.2.6 Face Picture Deleting
1. Check whether the device supports face picture deleting: GET /ISAPI/Intelligent/FDLib/capabilities?
```
format=json; if the value of the node supportFunction contains “delete”, it indicates that the device supports face
```
picture deleting.
2. Delete face pictures: PUT /ISAPI/Intelligent/FDLib/FDSearch/Delete?format=json&FDID=<FDID>&faceLibType=
```
<FDType>; if calling succeeded, it indicates that the device has deleted the face pictures.
```
3. If the value of the node supportFunction does not contain “delete”, it indicates that the device does not support
face picture deleting.
Hikvision co MMC
adil@hikvision.co.az
Face picture data, face picture quality grades, etc., can be collected via the face picture collecting function.
9.11.2.7 Face Picture Collecting
1. Check whether the device supports face picture collecting: GET /ISAPI/AccessControl/capabilities; if the node
```
isSupportCaptureFace is returned and its value is “true”, it indicates that the device supports face picture (captured
```
```
in visible light) collecting. If the node isSupportCaptureInfraredFace is returned and its value is “true”, it indicates
```
```
that the device supports face picture (captured in infrared light) collecting.
```
2. Collect face picture information: POST /ISAPI/AccessControl/CaptureFaceData.
If the node captureProgress is returned, and the value is 100, it indicates that the face picture has been collected,
and the binary data or URL of the collected face picture will be parsed.
If the node captureProgress is returned and the value is 0, it indicates that the face picture has not been collected,
Hikvision co MMC
adil@hikvision.co.az
Fingerprint management includes searching, applying, deleting, and collecting fingerprints.
and you need to get the progress of face picture collecting.
3. Get the progress of face picture collecting: GET /ISAPI/AccessControl/CaptureFaceData/Progress; repeatedly
call this API to get the progress of face picture collecting.
Repeatedly call this API until the node captureProgress is returned and its value is 100, which indicates that the
face picture has been collected and the binary data and URL of the face picture will be parsed.
If the value of the node captureProgress is 0 and the value of the isCurRequestOver is true, which indicates that the
face picture collecting failed, stop calling the API.
4. If the node isSupportCaptureFace is returned and its value is “false”, it indicates that the device does not support
face picture collecting.
9.12 Fingerprint Management
9.12.1 Introduction to the Function
9.12.2 API Calling Flow
9.12.2.1 Check Whether the Device Supports Fingerprint Management
Hikvision co MMC
adil@hikvision.co.az
Before calling the API for fingerprint management, make sure that the device supports fingerprint
management.
```
Note:
```
1. Check whether the device supports fingerprint management: GET /ISAPI/AccessControl/capabilities; if the
node isSupportFingerPrintCfg is returned and its value is “true”, it indicates that the device supports fingerprint
management.
2. Search, apply, add, and edit fingerprints.
3. If the node isSupportFingerPrintCfg is returned and its value is “false”, it indicates that the device does not support
fingerprint management.
Before applying the fingerprint information to the device, make sure that the related person information linked to
the person ID has been applied to the device.
```
The maximum number of fingerprints that can be applied to the device per person is 10 (the 10 fingerprints of a
```
```
person).
```
9.12.2.2 Fingerprint Search
Hikvision co MMC
adil@hikvision.co.az
Hikvision co MMC
adil@hikvision.co.az
The fingerprint search function is for searching the number of fingerprints and fingerprint information
added to the device.
```
Note:
```
1. Check whether the device supports fingerprint search: GET
```
/ISAPI/AccessControl/FingerPrintCfg/capabilities?format=json; if calling succeeded, it indicates that the
```
device supports fingerprint search.
2. Search the number of the specified persons’ fingerprints: GET /ISAPI/AccessControl/FingerPrint/Count?
```
format=json&employeeNo=<employeeNo>; the returned value of the node numberOfFP is the number of the added
```
fingerprints of the specified persons.
3. Search the number of fingerprints of all persons: GET /ISAPI/AccessControl/FingerPrint/Count?format=json;
the returned value of the node numberOfFP is the number of the added fingerprints of all persons.
4. Search fingerprint information: POST /ISAPI/AccessControl/FingerPrintUpload?format=json; the fingerprint
information is returned by page. If the value of the child node status of the node FingerPrintInfo is “NoFP”, it
indicates that all fingerprint information are returned.
5. If calling failed, it indicates that the device does not support fingerprint search.
The value of the node fingerPrintCapacity returned by calling GET
/ISAPI/AccessControl/CardReaderCfg/<cardReaderID>?format=json is the maximum number of fingerprints
supported by the card reader.
The value of the node fingerPrintNum returned by calling GET
/ISAPI/AccessControl/CardReaderCfg/<cardReaderID>?format=json is the number of fingerprints added to the
card reader.
9.12.2.3 Fingerprint Applying
Hikvision co MMC
adil@hikvision.co.az
Fingerprint information can be applied to the device via the fingerprint applying function. If the fingerprint
```
has been added to the device, the fingerprint information will be edited; if the fingerprint has not been
```
added to the device, the fingerprint will be added to the device.
```
Note:
```
Check whether the fingerprint has been added to the device via the nodes employeeNo and fingerPrintID returned after
calling the API for fingerprint applying.
1. Check whether the device supports fingerprint applying: GET
```
/ISAPI/AccessControl/FingerPrintCfg/capabilities?format=json; if the node isSupportSetUp is returned and
```
its value is “true”, it indicates that the device supports fingerprint applying.
2. Apply fingerprint information: POST /ISAPI/AccessControl/FingerPrint/SetUp?format=json.
3. If the node isSupportSetUp is returned and its value is false, it indicates that the device does not support
fingerprint applying.
9.12.2.4 Fingerprint Adding
Hikvision co MMC
adil@hikvision.co.az
Fingerprint information can be added to the device via the fingerprint adding function. If the fingerprint has
```
been added to the device, the device will report an error; if the fingerprint has not been added to the device,
```
the fingerprint will be added to the device.
1. Check whether the device supports fingerprint adding: GET
```
/ISAPI/AccessControl/FingerPrintCfg/capabilities?format=json; if calling succeeded, it indicates that the
```
device supports fingerprint adding.
2. Add fingerprint information: POST /ISAPI/AccessControl/FingerPrintDownload?format=json; if calling
succeeded, it indicates that the device has started to execute fingerprint adding, but it does not indicate that the
device has added the fingerprint.
3. Get the progress of fingerprint adding: GET /ISAPI/AccessControl/FingerPrintProgress?format=json;
repeatedly call this API to get the progress of fingerprint adding.
Hikvision co MMC
adil@hikvision.co.az
```
Note:
```
Check whether the fingerprint has been added to the device via the nodes employeeNo and fingerPrintID returned after
calling the API for fingerprint adding.
The fingerprint information on the device can be edited via the fingerprint information editing function. If
```
the fingerprint has been added to the device, the fingerprint information will be edited; if the fingerprint
```
has not been added to the device, the device will report an error.
```
Note:
```
4. If calling failed, it indicates that the device does not support fingerprint adding.
9.12.2.5 Fingerprint Information Editing
1. Check whether the device supports fingerprint information editing: GET
```
/ISAPI/AccessControl/FingerPrintCfg/capabilities?format=json; if calling succeeded, it indicates that the
```
device supports fingerprint information editing.
2. Edit fingerprint information: POST /ISAPI/AccessControl/FingerPrintModify?format=json.
3. If calling failed, it indicates that the device does not support fingerprint information editing.
Hikvision co MMC
adil@hikvision.co.az
Check whether the fingerprint has been added to the device via the nodes employeeNo and fingerPrintID returned
after calling the API for fingerprint information editing.
```
When the fingerprint information is edited, only the fingerprint parameters will be edited; the fingerprint data will
```
not be edited.
9.12.2.6 Fingerprint Deleting
Hikvision co MMC
adil@hikvision.co.az
The fingerprint information on the device can be deleted via the fingerprint deleting function. The device
will not report an error if the fingerprint information to be deleted is not added to the device.
1. Check whether the device supports fingerprint deleting: GET /ISAPI/AccessControl/capabilities; if the node
isSupportFingerPrintDelete is returned and its value is “true”, it indicates that the device supports fingerprint
deleting.
Hikvision co MMC
adil@hikvision.co.az
The fingerprint collecting function is for collecting the fingerprint data, fingerprint quality, etc.
2. Delete fingerprint information: PUT /ISAPI/AccessControl/FingerPrint/Delete?format=json; if calling
succeeded, it indicates that the device has started to execute fingerprint deleting, but it does not indicate that the
device has deleted the fingerprints.
3. Get the progress of fingerprint deleting: GET /ISAPI/AccessControl/FingerPrint/DeleteProcess?format=json;
repeatedly call this API to get the progress of fingerprint deleting.
4. If the node isSupportFingerPrintDelete is returned and its value is “false”, it indicates that the device does not
support fingerprint deleting.
9.12.2.7 Fingerprint Collecting
1. Check whether the device supports fingerprint collecting: GET /ISAPI/AccessControl/capabilities; if the node
isSupportCaptureFingerPrint is returned and its value is “true”, it indicates that the device supports fingerprint
collecting.
2. Collect fingerprint information: POST /ISAPI/AccessControl/CaptureFingerPrint.
3. If the node isSupportCaptureFingerPrint is returned and its value is “false”, it indicates that the device does not
support fingerprint collecting.
9.13 Iris Data Management
Hikvision co MMC
adil@hikvision.co.az
Iris data management includes searching, applying, adding, editing, deleting, and collecting iris data.
Before calling the API for iris data management, make sure that the device supports iris data management:
```
Note:
```
9.13.1 Introduction to the Function
9.13.2 API Calling Flow
9.13.2.1 Check Whether the Device Supports Iris Data Management
1. Check whether the device supports iris data management: GET /ISAPI/AccessControl/capabilities; if the node
isSupportIrisInfo is returned and its value is true, it indicates that the device supports iris data management.
2. Search, apply, add, edit, and delete iris data.
3. If the node isSupportIrisInfo is returned and its value is false, it indicates that the device does not support iris data
management.
Before applying, adding, and editing the iris data on the device, make sure that the related person information
linked to the person ID has been applied to the device.
```
Data for up to two irises of each person (two eyes of each person) can be applied to the device.
```
9.13.2.2 Iris Data Search
Hikvision co MMC
adil@hikvision.co.az
The iris data search function is for searching the number of irises and iris information added to the device.
1. Check whether the device supports iris data search: GET /ISAPI/AccessControl/IrisInfo/capabilities?
```
format=json; if the node supportFunction is returned, and the value contains “get”, it indicates that the device
```
supports iris data search.
2. Search the number of irises: GET /ISAPI/AccessControl/IrisInfo/count?format=json; the value of the node
IrisNumber is the number of added irises on the device.
3. Search iris information: POST /ISAPI/AccessControl/IrisInfo/search?format=json; the searched iris
information will be returned by page.
Hikvision co MMC
adil@hikvision.co.az
```
Note:
```
The value of the node maxRecordNum returned by calling GET /ISAPI/AccessControl/IrisInfo/capabilities?
```
format=json is the maximum number of irises supported by the device.
```
The iris data applying function is for applying iris information to the device. If the iris data has already been
```
applied to the device, the information about the iris will be edited; if the iris data has not been applied to
```
the device, the iris information will be added to the device.
4. If the value of the node supportFunction does not contain “get”, it indicates that the device does not support iris
data search.
9.13.2.3 Iris Data Applying
1. Check whether the device supports iris data applying: GET /ISAPI/AccessControl/IrisInfo/capabilities?
```
format=json; if the node supportFunction is returned and the value contains “setUp”, it indicates that the device
```
supports iris data applying.
2. Iris Data Applying: PUT /ISAPI/AccessControl/IrisInfo/setup?format=json.
3. If the value of the node supportFunction does not contain “setUp”, it indicates that the device does not support iris
Hikvision co MMC
adil@hikvision.co.az
```
Note:
```
Check whether the iris data have been applied to the device via the nodes employeeNo and id returned by calling the
API for iris data applying.
The iris data adding function is for adding the iris data to the device. If the iris data have already been
```
added to the device, the device will report an error; if the iris data have not been added to the device, the
```
iris data will be added to the device.
data applying.
9.13.2.4 Iris Data Adding
1. Check whether the device supports iris data adding: GET /ISAPI/AccessControl/IrisInfo/capabilities?
```
format=json; if the value of the node supportFunction contains “post”, it indicates that the device supports iris data
```
applying.
2. Add iris data: POST /ISAPI/AccessControl/IrisInfo/record?format=json.
3. If the value of the node supportFunction does not contain “post”, it indicates that the device does not support iris
data applying.
Hikvision co MMC
adil@hikvision.co.az
```
Note:
```
Check whether the iris data have been applied to the device via the nodes employeeNo and id returned by calling the
API for iris data adding.
The iris data editing function is for editing the applied iris information on the device. If the iris data have
```
already been added to the device, the iris information will be edited; if the iris data have not been added to
```
the device, the device will report an error.
```
Note:
```
9.13.2.5 Iris Data Editing
1. Check whether the device supports iris data editing: GET /ISAPI/AccessControl/IrisInfo/capabilities?
```
format=json; if the value of the node supportFunction contains “put”, it indicates that the device supports iris data
```
editing.
2. Edit iris information: PUT /ISAPI/AccessControl/IrisInfo/modify?format=json.
3. If the value of the node supportFunction does not contain “put”, it indicates that the device does not support iris
data editing.
Hikvision co MMC
adil@hikvision.co.az
Check whether the iris data have been applied to the device via the nodes employeeNo and id returned by calling the
API for iris data editing.
The iris data deleting function is for deleting the applied iris information on the device. If the iris data to be
deleted have not been applied to the device, the device will not report an error.
9.13.2.6 Iris Data Deleting
1. Check whether the device supports iris data deleting: GET /ISAPI/AccessControl/IrisInfo/capabilities?
```
format=json; if the value of the node supportFunction contains “delete”, it indicates that the device supports iris
```
data deleting.
2. Delete iris information: PUT /ISAPI/AccessControl/IrisInfo/delete?format=json; if calling succeeded, it
indicates that the iris information has been deleted.
3. If the value of the node supportFunction does not contain “delete”, it indicates that the device does not support iris
data deleting.
9.13.2.7 Iris Data Collecting
Hikvision co MMC
adil@hikvision.co.az
The iris data collecting function is for collecting iris data and information.
1. Check whether the device supports iris data collecting: GET /ISAPI/AccessControl/capabilities; if the node
isSupportCaptureIrisData is returned and its value is “true”, it indicates that the device supports iris data collecting.
2. Collect iris information: POST /ISAPI/AccessControl/captureIrisData?format=json; if calling succeeded, it
indicates that the device has started to execute the collection.
3. Get the progress of iris data collecting: GET /ISAPI/AccessControl/captureIrisData/progress?format=json;
repeatedly call this API until the value of captureProgress is returned and is 100, which indicates that the collecting
Hikvision co MMC
adil@hikvision.co.az
In some scenarios with higher security levels, you can set rules that the door will only open when different persons
authenticate in the access control point during fixed time.
```
For example, in a bank, a door will only open after two or more persons are authenticated (such as swiping card,
```
```
authenticated by fingerprint, face picture, iris, etc.). If a door is configured multi-factor authentication, the number
```
authentication persons, authentication order, and authentication methods should follow the rules.
The API calling flow is as follow:
completed.
4. If the node isSupportCaptureIrisData is returned and its value is “false”, it indicates that the device does not
support iris data collecting.
9.14 Multi-Factor Authentication
9.14.1 Introduction to the Function
9.14.2 API Calling Flow
9.14.2.1 Group Parameter Configuration
1. Check whether the device supports configuring group parameters: GET /ISAPI/AccessControl/capabilities; if
the node isSupportGroupCfg is returned and its value is "true", it indicates that the device supports configuring
group parameters.
2. Set group parameters: [GET/PUT] /ISAPI/AccessControl/GroupCfg/<groupID>?format=json.
Hikvision co MMC
adil@hikvision.co.az
After configuring the group parameters, the person and group will be linked through ****person management in the
```
process of person and credential management integration (through the belongGroup field). The corresponding
```
interface is as follows:
No more than 4 groups can be linked to one person.
The API calling flow is as follow:
3. If the node isSupportGroupCfg is returned and its value is "false", it indicates that the device does not support
configuring group parameters.
9.14.2.2 Add Person to Group
1. Set person information: PUT /ISAPI/AccessControl/UserInfo/SetUp?format=json
2. Add person information: POST /ISAPI/AccessControl/UserInfo/Record?format=json
3. Edit person information: PUT /ISAPI/AccessControl/UserInfo/Modify?format=json
9.14.2.3 Multi-Factor Authentication Mode Configuration
1. Check whether the device supports configuring multi-factor authentication mode: GET
```
/ISAPI/AccessControl/capabilities; if the node isSupportMultiCardCfg is returned and its value is "true", it
```
```
indicates that the device supports configuring multi-factor authentication mode (and the device also supports
```
```
configuring group parameters).
```
2. Set multi-factor authentication mode: [GET/PUT] /ISAPI/AccessControl/MultiCardCfg/<doorID>?format=json
3. If the node isSupportVerifyWeekPlanCfg is returned and its value is "false", it indicates that the device does not
support configuring multi-factor authentication mode.
Hikvision co MMC
adil@hikvision.co.az
```
The person and credential management function is person-based, and is for managing persons, credentials (cards,
```
```
fingerprints, face pictures, and iris data), and permission schedules which control the permissions for persons to enter
```
and exit the controlled areas. Its architecture is shown below.
```
This document mainly introduces the calling flows for person management and credential management (card,
```
```
fingerprint, face picture, iris data management). For details about the calling flow for permission schedule management,
```
refer to the “Management of Permission Schedules for Persons and Access Points”.
Person management includes searching, applying, adding, editing, and deleting persons.
9.15 Person and Credential Management
9.15.1 Introduction to the Function
9.16 Person Management
9.16.1 Introduction to the Function
9.16.2 API Calling Flow
9.16.2.1 Check Whether the Device Supports Person Management
Hikvision co MMC
adil@hikvision.co.az
Before calling the API for person management, make sure that the device supports person management.
```
Note:
```
```
The person ID (EmployeeNo) is the unique identifier for person and credential management. After calling GET
```
/ISAPI/AccessControl/capabilities, through the child nodes of EmployeeNoInfo which are employeeNo,
characterType, and isSupportCompress, the maximum string length and character types of the person ID supported by
the device can be checked. Generally, devices support up to 32 bytes and any type of characters. But for access
controllers and distribution-type access control devices, check through the child nodes mentioned above.
1. Check whether the device supports person management: GET /ISAPI/AccessControl/capabilities; if the node
isSupportUserInfo is returned and its value is true, it indicates that the device supports person management.
2. Search, apply, add, and edit persons.
3. If the node isSupportUserInfo is returned and its value is false, it indicates that the device does not support person
management.
9.16.2.2 Person Search
Hikvision co MMC
adil@hikvision.co.az
The person search function is for searching the number of persons and person information added to the
device.
1. Check whether the device supports person search: GET /ISAPI/AccessControl/UserInfo/capabilities?
```
format=json; if the value of the node supportFunction contains “get”, it indicates that the device supports person
```
search.
Hikvision co MMC
adil@hikvision.co.az
```
Note:
```
The value of the node maxRecordNum returned by calling GET /ISAPI/AccessControl/UserInfo/capabilities?
```
format=json is the maximum number of persons supported by the device.
```
Person information can be applied to the device via the person applying function. If the person has been
```
added to the device, the person information will be edited; if the person has not been added to the device,
```
the person information will be applied to the device.
2. Search the number of persons: GET /ISAPI/AccessControl/UserInfo/Count?format=json; the returned value of
the node userNumber is the number of the persons added to the device.
3. Search person information: POST /ISAPI/AccessControl/UserInfo/Search?format=json; the person information
is returned by page.
4. If the value of the node supportFunction does not contain “get”, it indicates that the device does not support
person search.
9.16.2.3 Person Applying
1. Check whether the device supports person applying: GET /ISAPI/AccessControl/UserInfo/capabilities?
Hikvision co MMC
adil@hikvision.co.az
```
Note:
```
Check whether the person has been added to the device via the node employeeNo returned after calling the API for
person applying.
Person can be added to the device via the person adding function. If the person has been added to the
```
device, the device will report an error; if the person has not been added to the device, the person will be
```
added to the device.
```
format=json; if the value of the node supportFunction contains “setUp”, it indicates that the device supports
```
person applying.
2. Apply person information: PUT /ISAPI/AccessControl/UserInfo/SetUp?format=json.
3. If the value of the node supportFunction does not contain setUp, it indicates that the device does not support
person applying.
9.16.2.4 Person Adding
Hikvision co MMC
adil@hikvision.co.az
```
Note:
```
Check whether the person has been added to the device via the node employeeNo returned after calling the API for
person adding.
1. Check whether the device supports person adding: GET /ISAPI/AccessControl/UserInfo/capabilities?
```
format=json; if the value of the node supportFunction contains “post”, it indicates that the device supports person
```
adding.
2. Add persons: POST /ISAPI/AccessControl/UserInfo/Record?format=json.
3. If the value of the node supportFunction does not contain “post”, it indicates that the device does not support
person adding.
9.16.2.5 Person Information Editing
Hikvision co MMC
adil@hikvision.co.az
Person information added to the device can be edited via the person information editing function. If the
```
person has been added to the device, the person information will be edited; if the person has not been
```
added to the device, the device will report an error.
```
Note:
```
Check whether the person has been added to the device via the node employeeNo returned after calling the API for
person information editing.
1. Check whether the device supports person information editing: GET
```
/ISAPI/AccessControl/UserInfo/capabilities?format=json; if the value of the node supportFunction contains
```
“put”, it indicates that the device supports person information editing.
2. Edit Person Information: PUT /ISAPI/AccessControl/UserInfo/Modify?format=json.
3. If the value of the node supportFunction does not contain “put”, it indicates that the device does not support
person information editing.
9.16.2.6 Person Deleting
Hikvision co MMC
adil@hikvision.co.az
The person added to the device can be deleted via the person deleting function. The device will not report
an error if the person to be deleted is not added to the device.
1. Check whether the device supports person deleting: GET /ISAPI/AccessControl/capabilities; if the node
isSupportUserInfoDetailDelete is returned and its value is “true”, it indicates that the device supports person
deleting.
2. Delete persons: PUT /ISAPI/AccessControl/UserInfoDetail/Delete?format=json; if calling succeeded, it
indicates that the device has started to execute person deleting, but it does not indicate that the device has deleted
the person.
3. Get the progress of deleting person information: GET /ISAPI/AccessControl/UserInfoDetail/DeleteProcess;
repeatedly call this API to get the progress of person deleting.
4. If the node isSupportUserInfoDetailDelete is returned and its value is “false”, it indicates that the device does not
Hikvision co MMC
adil@hikvision.co.az
```
Note:
```
```
When the person is deleted, the information on the credentials (the card, fingerprint, face picture, and iris data) linked
```
via the person ID will also be deleted.
In high-security scenarios, local device authentication alone is inadequate. Devices need to upload authentication
information to the platform, which then determines whether to unlock the door.
For example, in epidemic prevention scenarios, after a device collects person authentication and temperature data, it
uploads the information to the platform as an event. The platform then checks the person's recent travel history. Only
after confirming no issues does it send an approval result to unlock the door.
support person deleting.
9.17 Remote Verification
9.17.1 Function Introduction
9.17.2 Remote Verification in Arming Method
9.17.2.1 API Calling Flow
1. Get access control capabilities to check if the remote verification is supported: GET
/ISAPI/AccessControl/capabilities. Related field: isSupportRemoteCheck. If this field returns true, the device
supports remote verification.
2. Arm the device.
Hikvision co MMC
adil@hikvision.co.az
```
Note: Uploading verification results is not supported by all devices. Generally, only devices with firmware from 2024 or
```
later support this feature.
Recommended API calling sequence:
//Verification parameters in arming method
```
{
```
```
"AcsCfg":{
```
"remoteCheckDoorEnabled": true,//The main switch for remote verification, set to true
"checkChannelType": "ISAPI",//Verification channel type
```
"needDeviceCheck": true,//Whether the remote verification requires device authentication; true by default
```
```
"remoteCheckTimeout": 5,//Remote verification timeout (seconds); if no result is received within this time, the verification fails.
```
"remoteCheckVerifyMode": 7,//Credential type that require remote verification
```
"offlineDevCheckOpenDoorEnabled": false,//Whether to allow door opening based on local device authentication when offline; false by default
```
```
"remoteCheckUserTypeList": ["normal", "visitor", "unregistered"]//List of person types requiring remote verification; if absent or empty, all person
```
types require remote verification.
```
}
```
```
}
```
```
Note: How to understand and set the remoteCheckVerifyMode field for credential type requiring remote verification?
```
remoteCheckVerifyMode descriptions:
```
Note: For detailed arming process, refer to the Event Arming Management. The key difference is that non-
```
subscription mode uses HTTP GET to receive all event messages, while subscription mode uses HTTP POST to
receive only subscribed events. Both HTTP connections are established by the platform.
Subscription mode: POST /ISAPI/Event/notification/subscribeEvent?deployID=<deployID>.
Non-subscription mode: GET /ISAPI/Event/notification/alertStream?deployID=<deployID>.
3. Configure remote verification parameters: PUT /ISAPI/AccessControl/AcsCfg?format=json.
4. The platform receives verification requests from the device. When the device uploads an event
```
(AccessControllerEvent, IDCardInfoEvent, QRCodeEvent, or FaceTemperatureMeasurementEvent) with the field
```
remoteCheck set to true, it indicates remote verification is required.
5. The platform sends remote verification results and the device controls door based on the results: PUT
/ISAPI/AccessControl/remoteCheck?format=json&security=<security>&iv=<iv>.
6. (Dependent) If the device initially uploaded an access control event (AccessControllerEvent), it can upload a
verification event after remote verification is complete. This event must be of type AccessControllerEvent and
include the remoteCheckResult field.
9.17.2.2 Examples
9.17.2.2.1 Configure Remote Verification Parameters
1. Call GET /ISAPI/AccessControl/capabilities to check if isSupportAcsCfg is true; if true, verification parameter
configuration is supported.
2. Call GET /ISAPI/AccessControl/AcsCfg/capabilities?format=json to get supported parameters and ranges.
3. Call GET /ISAPI/AccessControl/AcsCfg?format=json to get current configurations.
4. Call PUT /ISAPI/AccessControl/AcsCfg?format=json to edit parameters.
Hikvision co MMC
adil@hikvision.co.az
Value Description
1 Face and ID card comparison
2 Face recognition
3 Face and ID card comparison or face recognition
4 Card swiping
5 Face and ID card comparison or card swiping
6 Face recognition or card swipe
7 Face and ID card comparison, card swipe, or face recognition
8 QR code
9 Face and ID card comparison or QR code
10 Face recognition or QR code
11 Face and ID card comparison, face recognition, or QR code
12 Card swipe or QR code
13 Face and ID card comparison, card swipe, or QR code
14 Face recognition, card swipe, or QR code
15 Face and ID card comparison, card swipe, face recognition, or QR code
```
Remarks:
```
Recommended API calling sequence:
//Example of sending verification results
```
{
```
```
"RemoteCheck":{
```
"serialNo": 1,//Event serial number, matching the device-uploaded event serial number
"checkResult": "success",//Verification succeeded
```
}
```
```
}
```
1. Face and ID card comparison: Refers to face recognition + ID card swiping by default.
2. When remote verification requires credentials local authentication (i.e., needDeviceCheck is true), if
remoteCheckVerifyMode is set to 2#Face recognition, it means face recognition triggers remote verification after
```
device local authentication; other methods only require local authentication.
```
3. When remote verification requires credentials local authentication (i.e., needDeviceCheck is false), if
remoteCheckVerifyMode is set to 2#Face recognition, it means face recognition directly triggers remote
```
verification without device local authentication; other methods do not trigger remote verification and depend on
```
the device local authentication.
9.17.2.2.2 Send Verification Results
1. Call GET /ISAPI/AccessControl/capabilities to check if isSupportRemoteCheck is true; if true, sending remote
verification results is supported.
2. Call GET /ISAPI/AccessControl/remoteCheck/capabilities?format=json to get supported parameters and
ranges.
3. Call PUT /ISAPI/AccessControl/remoteCheck?format=json&security=<security>&iv=<iv> to send verification
results.
9.17.3 Remote Verification in Asynchronous Listening Method
9.17.3.1 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az
1. Get access control capabilities to check if the remote verification is supported: GET
/ISAPI/AccessControl/capabilities. Related field: isSupportRemoteCheck. If this field returns true, the device
supports remote verification.
2. Configure listening server parameters.
```
Note:
```
POST /ISAPI/Event/notification/httpHosts?security=<security>&iv=<iv>
PUT /ISAPI/Event/notification/httpHosts/<hostID>?security=<security>&iv=<iv>.
For detailed listening server configuration, refer to the API calling flow in the HTTP Listening Service
domain.
```
By default, access control devices support only one HTTP(S) listening server. In listening mode, the platform
```
opens a listening service on its own IP and port. The device then establishes a connection to send messages,
this connection can be closed after transmission or kept open persistently.
3. Configure remote verification parameters: PUT /ISAPI/AccessControl/AcsCfg?format=json.
4. The platform receives remote verification requests.
Hikvision co MMC
adil@hikvision.co.az
POST /ISAPI/Event/notification/httpHosts?security=1&iv=cd128e54036c0038a083992406de5320
<?xml version="1.0" encoding="UTF-8"?>
<HttpHostNotification version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
<id>1</id>
<url>/ISAPI/AddHttpHost/Test</url>
<protocolType>HTTP</protocolType>
<parameterFormatType>XML</parameterFormatType>
<addressingFormatType>ipaddress</addressingFormatType>
<ipAddress>10.8.98.62</ipAddress>
<portNo>7333</portNo>
<httpAuthenticationMethod>none</httpAuthenticationMethod>
</HttpHostNotification>
Explanation
Recommended API calling sequence:
//Verification parameters in ISAPI asynchronous listening method
```
{
```
```
"AcsCfg":{
```
"remoteCheckDoorEnabled": true,//The main switch for remote verification, set to true
"checkChannelType": "ISAPIListen",//Verification channel type
```
"needDeviceCheck": true,//Whether the remote verification requires credentials local authentication; true by default
```
```
"remoteCheckTimeout": 5,//Remote verification timeout (seconds); if no result is received within this time, the verification fails.
```
"remoteCheckVerifyMode": 7,//Credential type that require remote verification
```
"offlineDevCheckOpenDoorEnabled": false,//Whether to allow door opening based on local device authentication when offline; false by default
```
```
"remoteCheckUserTypeList": ["normal", "visitor", "unregistered"],//List of person types requiring remote verification; if absent or empty, all
```
person types require remote verification.
```
"remoteCheckWithISAPIListen": "async",//Result return mode under ISAPI listening mode: "async" (asynchronous)
```
```
}
```
```
}
```
```
The device sends requests via HTTP(S) POST. Each request contains one of the following event types, with
```
remoteCheck field set to true.
```
Access control event (AccessControllerEvent)
```
```
ID card event (IDCardInfoEvent)
```
```
QR code event (QRCodeEvent)
```
```
Face temperature measurement event (FaceTemperatureMeasurementEvent)
```
5. The platform sends remote verification results and the device controls door based on the results: PUT
/ISAPI/AccessControl/remoteCheck?format=json&security=<security>&iv=<iv>.
6. (Dependent) If the device initially uploaded an access control event (AccessControllerEvent), it can upload a
verification event after remote verification is complete. This event must be of type AccessControllerEvent and
include the remoteCheckResult field. Note: Uploading verification results is not supported by all devices.
Generally, only devices with firmware from 2024 or later support this feature.
9.17.3.2 Examples
9.17.3.2.1 Add a Listening Server
```
url: URL configured by the platform and used for device to upload remote verification requests.
```
```
ipAddress: Platform (server) IP.
```
```
portNo: Platform (server) listening port.
```
```
httpAuthenticationMethod: HTTP(S) communication authentication type (e.g., none for no authentication). MD5
```
digest authentication is recommended for higher security.
9.17.3.2.2 Configure Remote Verification Parameters
1. Call GET /ISAPI/AccessControl/capabilities to check if isSupportAcsCfg is true; if true, verification parameter
configuration is supported.
2. Call GET /ISAPI/AccessControl/AcsCfg/capabilities?format=json to get supported parameters and ranges.
3. Call GET /ISAPI/AccessControl/AcsCfg?format=json to get current configurations.
4. Call PUT /ISAPI/AccessControl/AcsCfg?format=json to edit parameters.
Hikvision co MMC
adil@hikvision.co.az
```
Example (Access Control Event)
```
POST /ISAPI/AddHttpHost/Test HTTP/1.1
```
Accept: text/html, application/xhtml+xml, */*
```
Accept-Language: zh-cn
```
Content-Type: multipart/form-data;boundary=boundary //Note: Form data format
```
```
User-Agent: Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)
```
Accept-Encoding: gzip, deflate
```
Host: 10.21.84.13:7333
```
Content-Length: 92406
```
Connection: Keep-Alive
```
Cache-Control: no-cache
--boundary
```
Content-Disposition: form-data; name="AccessControllerEvent"
```
```
Content-Type: application/json; charset="UTF-8"
```
Content-Length: 202
```
{
```
"ipAddress": "10.6.123.199",
"portNo": 80,
"channelID": 6,
"dateTime": "2022-11-14T13:41:56+08:00",
"activePostCount": 1,
"eventType": "AccessControllerEvent",
"eventState": "active",
"eventDescription": "Access Controller Event",
```
"AccessControllerEvent": {
```
"deviceName": "Access Controller",
"majorEventType": 5,
"subEventType": 75,
"time": "2022-11-14T13:41:56+08:00",
"name": "test123",
"employeeNoString": "test",
"serialNo": 1866,
"currentEvent": true,
"remoteCheck": true,
"frontSerialNo": 1865,
"picturesNumber": 1
```
}
```
```
}
```
--boundary
```
Content-Disposition: form-data; name="Picture";filename="Picture.jpg";
```
Content-Type: image/jpeg
Content-Length: 92204
[Binary image data]
--boundary--
HTTP/1.1 200 OK
```
Connection:close
```
```
Note: For field "remoteCheck", true indicates remote verification is required.
```
Refer to the example of Remote Verification in Arming Method.
9.17.3.2.3 Receive Verification Requests from Device
9.17.3.2.4 Send Verification Results
9.17.4 Remote Verification in Synchronous Listening Method
9.17.4.1 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az1. Get access control capabilities to check if the remote verification is supported: GET
/ISAPI/AccessControl/capabilities. Related field: isSupportRemoteCheck. If this field returns true, the device
supports remote verification.
2. Configure listening server parameters.
```
Note:
```
POST /ISAPI/Event/notification/httpHosts?security=<security>&iv=<iv>
PUT /ISAPI/Event/notification/httpHosts/<hostID>?security=<security>&iv=<iv>.
For detailed listening server configuration, refer to the API calling flow in the HTTP Listening Service
domain.
```
By default, access control devices support only one HTTP(S) listening server. In listening mode, the platform
```
opens a listening service on its own IP and port. The device then establishes a connection to send messages,
this connection can be closed after transmission or kept open persistently.
3. Configure remote verification parameters: PUT /ISAPI/AccessControl/AcsCfg?format=json.
4. The platform receives remote verification requests and sends back results synchronously.
a. The device sends requests via HTTP(S) POST. Each request contains one of the following event types, with
remoteCheck field set to true.
```
Access control event (AccessControllerEvent)
```
Hikvision co MMC
adil@hikvision.co.az
```
Note: Uploading verification results is not supported by all devices. Generally, only devices with firmware from 2024 or
```
later support this feature.
Refer to examples in Remote Verification in Asynchronous Listening Method.
Recommended API calling sequence:
//Verification parameters in ISAPI synchronous listening method
```
{
```
```
"AcsCfg":{
```
"remoteCheckDoorEnabled": true,//The main switch for remote verification, set to true
"checkChannelType": "ISAPIListen",//Verification channel type, set to ISAPIListen for ISAPI listen channel
```
"needDeviceCheck": true,//Whether the remote verification requires credentials local authentication; true by default
```
```
"remoteCheckTimeout": 5,//Remote verification timeout (seconds); if no result is received within this time, the verification fails.
```
"remoteCheckVerifyMode": 7,//Credential type that require remote verification
```
"offlineDevCheckOpenDoorEnabled": false,//Whether to allow door opening based on local device authentication when offline; false by default
```
```
"remoteCheckUserTypeList": ["normal", "visitor", "unregistered"],//List of person types requiring remote verification; if absent or empty, all
```
person types require remote verification.
```
"remoteCheckWithISAPIListen": "sync",//Result return mode under ISAPI listening mode: "sync" (synchronous)
```
```
}
```
```
}
```
```
Example (Access Control Event):
```
b. The platform synchronously sends results in HTTP(S) Response Body. That is, the actual return data from
platform to device is the request message of URL PUT /ISAPI/AccessControl/remoteCheck?format=json.
```
ID card event (IDCardInfoEvent)
```
```
QR code event (QRCodeEvent)
```
```
Face temperature measurement event (FaceTemperatureMeasurementEvent)
```
5. The platform sends remote verification results and the device controls door based on the results: PUT
/ISAPI/AccessControl/remoteCheck?format=json&security=<security>&iv=<iv>.
6. (Dependent) If the device initially uploaded an access control event (AccessControllerEvent), it can upload a
verification event after remote verification is complete. This event must be of type AccessControllerEvent and
```
include the remoteCheckResult field. The platform should return 200 OK in HTTP(S) Headers upon receiving the
```
result event.
9.17.4.2 Examples
9.17.4.2.1 Add a Listening Server
9.17.4.2.2 Configure Remote Verification Parameters
1. Call GET /ISAPI/AccessControl/capabilities to check if isSupportAcsCfg is true; if true, verification parameter
configuration is supported.
2. Call GET /ISAPI/AccessControl/AcsCfg/capabilities?format=json to get supported parameters and ranges.
3. Call GET /ISAPI/AccessControl/AcsCfg?format=json to get current configurations.
4. Call PUT /ISAPI/AccessControl/AcsCfg?format=json to edit parameters.
9.17.4.2.3 Receive Verification Requests and Return Results Synchronously
Hikvision co MMC
adil@hikvision.co.az
POST /ISAPI/AddHttpHost/Test HTTP/1.1
```
Accept: text/html, application/xhtml+xml, */*
```
Accept-Language: zh-cn
```
Content-Type: multipart/form-data;boundary=boundary //Note: Form data format
```
```
User-Agent: Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)
```
Accept-Encoding: gzip, deflate
```
Host: 10.21.84.13:7333
```
Content-Length: 92406
```
Connection: Keep-Alive
```
Cache-Control: no-cache
--boundary
```
Content-Disposition: form-data; name="AccessControllerEvent"
```
```
Content-Type: application/json; charset="UTF-8"
```
Content-Length: 202
```
{
```
"ipAddress": "10.6.123.199",
"portNo": 80,
"channelID": 6,
"dateTime": "2022-11-14T13:41:56+08:00",
"activePostCount": 1,
"eventType": "AccessControllerEvent",
"eventState": "active",
"eventDescription": "Access Controller Event",
```
"AccessControllerEvent": {
```
"deviceName": "Access Controller",
"majorEventType": 5,
"subEventType": 75,
"time": "2022-11-14T13:41:56+08:00",
"name": "test123",
"employeeNoString": "test",
"serialNo": 1866,
"currentEvent": true,
"remoteCheck": true,
"frontSerialNo": 1865,
"picturesNumber": 1
```
}
```
```
}
```
--boundary
```
Content-Disposition: form-data; name="Picture";filename="Picture.jpg";
```
Content-Type: image/jpeg
Content-Length: 92204
[Binary image data]
--boundary--
HTTP/1.1 200 OK
```
Date: Thu, 14 Nov 2022 13:42:40 GMT
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
```
X-XSS-Protection: 1; mode=block
```
Content-Length: 81
```
Connection: close
```
```
Pragma: no-cache
```
Cache-Control: no-cache
Content-Type: application/json
```
{
```
```
"RemoteCheck":{
```
"serialNo": 1,
"checkResult": "success"
```
}
```
```
}
```
```
Note: For field "remoteCheck", true indicates remote verification is required.
```
Device does not perform device local authentication and only central verification is required. This is mainly for
scenarios where person information is managed on the platform rather than on devices. Key differences from general
remote verification:
Example of sending verification results:
9.17.5 Remote Verification by Platform Only
1. When configuring the verification parameters, ensure that the needDeviceCheck field in PUT
/ISAPI/AccessControl/AcsCfg?format=json is set to false.
2. When applying verification results, include the field userInfo in the input message of PUT
/ISAPI/AccessControl/remoteCheck?format=json&security=<security>&iv=<iv> to display the person
information on the device's local UI.
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"RemoteCheck":{
```
"serialNo": 1,//Event serial number, matching the device-uploaded event serial number
"checkResult": "success",//Verification succeeded
```
"userInfo": { //Person information
```
"name": "zhangsan", //Person name
"employeeNo": "123456", //Employee ID
"QRCodeInfo": "test45678", //QR code information
"filePathType": "URL", //Face image file type: URL
"filePath": "test123" //Face image file URL path
```
}
```
```
}
```
```
}
```
In tourist attractions, access control gates verify visitor tickets purchased through a platform. Both individual and group
```
tickets (allowing multiple entries per ticket) are supported. Credential types include QR code, card swiping, or face and
```
ID card comparison. The platform can configure which credential type requires remote verification. After successful
remote verification, the gate's local interface may display the permitted and actual passage counts. The platform then
synchronizes ticket status in real-time based on person passing events.
For group tickets, the remote verification process between the platform and the gate is as follows:
9.17.6 Group Ticket Remote Verification
9.17.6.1 Function Introduction
9.17.6.2 API Calling Flow
Hikvision co MMC
adil@hikvision.co.az
1. Upload a remote verification request.
Access control event: AccessControllerEvent. When remoteCheck field is set to true, it indicates that the platform
remote verification is required.
2. The platform applies remote verification results.
```
URL: PUT /ISAPI/AccessControl/remoteCheck?format=json&security=<security>&iv=<iv>.
```
Field passableUserNum: Specifies the number of allowable passages for the group ticket.
Field QRCodeInfo: Associate the group ticket information for later uploaded passing events.
3. Upload person passing event.
```
After passage, the gate uploads an access control event: AccessControllerEvent. (major type: 0x5, minor
```
```
type: 0xda).
```
The event includes information:
Hikvision co MMC
adil@hikvision.co.az
```
Note: The platform can configure whether the gate allows multiple verifications simultaneously by calling PUT
```
/ISAPI/AccessControl/ChannelControllerCfg?personnelChannelID=<personnelChannelID>. Set memoryModeEnabled
to true to enable simultaneous verifications without waiting for previous ones to complete.
Text QR code remote verification enable users to scan a text-based QR code on a device. The device uploads the QR
code information to the platform for identity verification, and then controls door opening upon successful verification.
For example, in a courthouse, lawyers can scan lawyer codes for access.
Prerequisites
For access control devices supporting working mode switching, verification varies according to current working mode.
Devices like turnstiles that do not support enabling/disabling text QR code will default to supporting QR code scanning
if a QR code reader is connected.
Associated QR code: QRCodeInfo field.
Allowable passages of associated QR code: passableUserNum field.
Passed passages of associated QR code: passedUserNum field.
9.17.7 Text QR Code Remote Verification
9.17.7.1 Function Introduction
9.17.7.2 API Calling Flow
```
Set the working mode (access control mode / permission free mode) via PUT
```
```
/ISAPI/AccessControl/IdentityTerminal (field workMode).
```
Enable or disable the text QR code by either:
Call PUT /ISAPI/AccessControl/AcsCfg?format=json and set QRCodeEnabled to true.
Call PUT /ISAPI/AccessControl/IdentityTerminal and set twoDimensionCode to true.
Enable temperature measurement for devices that will upload the verification request only after temperature
measurement.
Call PUT /ISAPI/AccessControl/AcsCfg?format=json and set thermalEnabled to true.
9.17.7.2.1 When Text QR Code is Enabled
Access control mode: Users must first scan the QR code and then complete credential authentication before the
```
device uploads a verification request as an access control event (AccessControllerEvent).
```
Thus, under access control mode, for text QR code remote verification, the remote verification credential type
should not be set to QR code only, that is, the remoteCheckVerifyMode field in PUT
/ISAPI/AccessControl/AcsCfg?format=json should not be set to 8#QR code.
Permission free mode: After users scan the QR code, the device immediately uploads a verification request as a QR
```
code event (QRCodeEvent).
```
9.17.7.2.2 When Text QR Code is Disabled
```
For card number QR codes or visitor QR codes (QR code 1.0, 2.0, 3.0), which the device can parse directly, after
```
scanning, the device parses the QR code data and immediately uploads a verification request as an access control
```
event (AccessControllerEvent).
```
For text QR codes that the device cannot parse, after scanning, the device immediately uploads a verification
```
request as a QR code event (QRCodeEvent).
```
9.17.7.2.3 Notes
```
9.18 Reset Anti-Passback Rule (Additional Function)
```
Hikvision co MMC
adil@hikvision.co.az
Anti-passback rules which can be reset:
Application scenarios: The anti-passback function will be help to reduce the cost of manual monitoring. Anti-passback
by time period and by time cannot set at the same time.
Calling Flow:
ISAPI Protocol Calling Flow:
It is required to connect to door permission and schedule template of access permission related to each door before
applying permissions to persons. For applying permissions to persons, see calling flow of Person Management of
Person and Credential Management. Configuring schedules of persons' access permission is required, or the related
persons cannot access.
1 weekly schedule and 4 holiday groups can be added in each schedule template. The priority of holiday schedule is
higher than that of weekly schedule. Weekly schedule can be configured by day of a week and 8 different time period of
a day. 16 holiday schedules can be added to a holiday group schedule. Each holiday schedule has its start and end day,
```
and the time period is same in the holiday range (8 time periods can be added). The access control can follow the
```
9.18.1 Introduction to the Function
1. Reset by authentication interval. This function will take effect in specific time period after the anti-passbak is
triggered. If the user trigger the function by swiping a card by route, the anti-passback flag will be reset in certain
time.
2. Reset by time. The anti-passback flag will be reset automatically in certain time.
3. Invalid mode. The resetting rule is disabled.
9.18.2 API Calling Flow
1. Get the capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportAntiPassbackResetRules is returned and its value is "true", it indicates that the device supports resetting
rules of anti-passback.
2. Get resetting rules of anti-passback: GET /ISAPI/AccessControl/AntiPassback/resetRules?format=json;
configure resetting rules of anti-passback: PUT /ISAPI/AccessControl/AntiPassback/resetRules?format=json.
9.19 Schedules Management of Persons' Access Permission
9.19.1 Introduction to the Function
Hikvision co MMC
adil@hikvision.co.az
schedule template to manage person's permissions by time.
9.19.2 API Calling Flow
9.19.2.1 Schedule Template of Persons' Access Permission
Hikvision co MMC
adil@hikvision.co.az
Calling Flow:
1. Check whether the device supports schedule template configuration of person's permission: GET
```
/ISAPI/AccessControl/capabilities; if the node isSupportUserRightPlanTemplate is returned and its value is
```
```
"true", it indicates that the device supports schedule template configuration of person's permission (if it supports, it
```
```
also supports weekly schedule configuration of persons' permission).
```
2. Schedule template configuration of persons' permission: [GET/PUT]
/ISAPI/AccessControl/UserRightPlanTemplate/<planTemplateID>?format=json.
3. Configuring schedule template of persons' access permission control for the device is not supported.
9.19.2.2 Weekly Schedule of Persons' Access Permission
Hikvision co MMC
adil@hikvision.co.az
Calling Flow:
1. Check whether the device supports weekly schedule configuration of persons' permissions: GET
```
/ISAPI/AccessControl/capabilities; if the node isSupportCardRightWeekPlanCfg is returned and its value is
```
"true", it indicates that the device supports weekly schedule configuration of person's permissions.
2. Weekly schedule configuration of persons' permissions:[GET/PUT]
/ISAPI/AccessControl/UserRightWeekPlanCfg/<weekPlanID>?format=json.
3. Configuring weekly schedule of persons' access permission control for the device is not supported.
9.19.2.3 Holiday Groups of Persons' Access Permission
Hikvision co MMC
adil@hikvision.co.az
Calling Flow:
1. Check whether the device supports holiday group configuration of person's permissions: GET
```
/ISAPI/AccessControl/capabilities; if the nodeisSupportUserRightHolidayGroupCfg is returned and its value is
```
```
"true", it indicates that the device supports holiday group configuration of person's permission (if it supports, it
```
```
also supports holiday schedule configuration of persons' permissions).
```
2. Holiday group configuration of persons' permissions:[GET/PUT]
/ISAPI/AccessControl/UserRightHolidayGroupCfg/<holidayGroupID>?format=json.
3. Configuring holiday groups of persons' access permission control for the device is not supported.
9.19.2.4 Holiday Schedule of Persons' Access Permission
Hikvision co MMC
adil@hikvision.co.az
Calling Flow:
1. Check whether the device supports holiday schedule configuration of persons' permissions: GET
```
/ISAPI/AccessControl/capabilities; if the node isSupportCardRightHolidayPlanCfg is returned and its value is
```
"true", it indicates that the device supports holiday schedule configuration of person's permissions.
2. Holiday schedule configuration of persons' permissions:[GET/PUT]
/ISAPI/AccessControl/UserRightHolidayPlanCfg/<holidayPlanID>?format=json.
3. Configuring holiday schedule of persons' access permission control for the device is not supported.
Hikvision co MMC
adil@hikvision.co.az
The device supports configuring storage parameters of access control event, searching for access control events, and
searching for the amount of access control events. There are three storage modes: deleting old events periodically,
deleting old events by specified time and overwriting.
9.20 Search for QR Code Scanning Event
4. Get the functional capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportQRCodeEvent is returned and its value is "true", it indicates that the device supports searching for QR
code scanning events.
5. Get the capability of searching for QR code scanning events: GET
/ISAPI/AccessControl/QRCodeEvent/capabilities?format=json.
6. Search for QR code scanning events: POST /ISAPI/AccessControl/QRCodeEvent?format=json. Notes: the device
displays QR code rather than authentication information.
9.21 Store and Search for Access Control Event
9.21.1 Introduction to the Function
9.21.2 API Calling Flow
9.21.2.1 Configure Storage Parameters of Access Control Events
1. Call the functional capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportEventStorageCfg is returned and its value is "true", it indicates that the device supports configuring the
storage parameters of access control events.
2. Get the configuration capability of storing access control events: GET
/ISAPI/AccessControl/AcsEvent/StorageCfg/capabilities?format=json.
3. Get and set storage parameters of access control events: GET|PUT /ISAPI/AccessControl/AcsEvent/StorageCfg?
```
format=json.
```
9.21.2.2 Search for Access Control Events
1. Call the functional capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportAcsEvent is returned and its value is "true", it indicates that the device supports searching for access
control events.
2. Get the capability of searching for access control events: GET /ISAPI/AccessControl/AcsEvent/capabilities?
```
format=json.
```
3. Search for access control events: POST /ISAPI/AccessControl/AcsEvent?format=json.
9.21.2.3 Get Total Number of Access Control Events
1. Call the functional capability of access control: GET /ISAPI/AccessControl/capabilities; if the node
isSupportAcsEventTotalNum is returned and its value is "true", it indicates that the device supports getting the total
number of access control events.
2. Get the capability of getting total number of access control events by specific conditions: GET
/ISAPI/AccessControl/AcsEventTotalNum/capabilities?format=json.
3. Get the total number of access control events by specific conditions: POST
/ISAPI/AccessControl/AcsEventTotalNum?format=json.
```
10 Video Intercom (General)
```
Hikvision co MMC
adil@hikvision.co.az
```
The device can initiate a call request to the platform. The platform responds with a call interaction signaling (such as
```
```
answer, reject, etc.). Upon sending an answer signal, the platform creates a two-way audio intercom link, enabling the
```
```
voice data transmission between both parties. (Refer to the two-way audio integration flow.)
```
```
Notes:
```
10.1 Call Interaction
10.1.1 Function Introduction
1. Call interaction signaling can also be used for two-way audio between devices. The two-way audio between
devices is implemented based on a private SIP protocol.
2. For two-way audio between devices, if a main station that uses the new device number rules is involved as an
intercom party, it is necessary to pre-configure the peer device number parsing rules on the main station to ensure
the compatibility with both old and new device numbers.
10.1.2 Integration Flow
10.1.2.1 Sequence Diagram
10.1.2.2 Integration Steps
1. The device triggers a call, which is triggered by a physical button pressing or local UI interface.
2. The device uploads an intercom interaction event (eventType: voiceTalkEvent).
Example message for device calling the platform:
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"ipAddress": "172.6.64.7",
"ipv6Address": "1080:0:0:0:8:800:200C:417A",
"portNo": 80,
"protocol": "HTTP",
"macAddress": "01:17:24:45:D9:F4",
"channelID": 1,
"dateTime": "2004-05-03T17:30:08+08:00",
"activePostCount": 1,
"eventType": "voiceTalkEvent",
"eventState": "active",
"eventDescription": "Voice Talk Interactive Event",
"deviceID": "test0123",
```
"VoiceTalkEvent":{
```
"deviceName": "Door Station",
"deviceId": "10000000101",
"cmdType": "request",
```
"src":{
```
"periodNumber": 1,
"buildingNumber": 1,
"unitNumber": 1,
"floorNumber": 1,
"roomNumber": 1,
"devIndex": 1,
"unitType": "outdoor"
```
},
```
```
"target":{
```
"unitType": "center",
"callType": "voice"
```
},
```
"serialNo": 2,
"currentEvent": true,
"frontSerialNo": 1,
"pictureURL": "test",
"picturesNumber": 1
```
}
```
```
}
```
```
Note: You can get the device's capability to check whether the intercom interaction event (eventType:
```
```
voiceTalkEvent) is supported.
```
```
Request:
```
GET /ISAPI/System/capabilities
```
Response:
```
<isSupportVoiceTalkEvent>true</isSupportVoiceTalkEvent>
When the device's isSupportVoiceTalkEvent field is returned with true value, it indicates that the device supports
the intercom interaction event.
3. The platform sets the call signaling.
```
Request:
```
PUT /ISAPI/VideoIntercom/callSignal?format=json
// Example: Answer the current call
```
{
```
```
"CallSignal": {
```
"cmdType": "answer"
```
}
```
```
}
```
// Example: Reject the current call
```
{
```
```
"CallSignal": {
```
"cmdType": "reject"
```
}
```
```
}
```
Hikvision co MMC
adil@hikvision.co.az
```
The peripheral No. is used to specify a certain peripheral (such as detector, network camera, relay, and sounder) when
```
you perform operations including configuring parameters and upgrading devices. For details about rules, see the
picture below:
```
Note: Before setting the call signaling, the platform can first call the API GET
```
/ISAPI/VideoIntercom/callSignal/capabilities?format=json to obtain the detailed parameters supported by
the device for the call interaction signaling.
4. Perform the two-way audio between the platform and the device, refer to the API calling flow of two-way audio.
11 Zone Alarm
11.1 Peripheral Management
11.1.1 Peripheral No.
11.2 Topology of Detectors and Peripherals
11.2.1 Topology of Detectors
Hikvision co MMC
adil@hikvision.co.az
```
1 (access wired detectors via onboard zones), 2 (access pircams via the RS-485 bus), 5 (access 1 to 2 detectors by
```
```
connecting the RS-485 bus with e-map fences), 6 (access 1 detector by enabling the function of extending zones for e-
```
```
map fences), 7 (access wireless detectors by connecting the RS-485 bus with R3/RX receivers), 8 (access wired
```
```
detectors via multi-channel wired zone modules), 10 (access wired detectors via keypads), 11 (access wired detectors
```
```
via network zone modules)
```
```
1 (access wired detectors via onboard transmitters), 3 (access wireless detectors via internal wireless receivers), 4
```
```
(access 1 to 2 wired detectors by enabling the function of extending zones for some magnetic contact detectors), 9
```
```
(access wired detectors by connecting wireless receivers with single-channel / multi-channel transmitters)
```
The hybrid security control panel can access detectors in the following ways:
The wireless security control panel can access detectors in the following ways:
11.2.2 Topology of Peripherals
Hikvision co MMC
adil@hikvision.co.az
```
1 (access keypads via the RS-485 bus), 2 (access wireless cards and keyfobs via keypads), 3 (access wired sounders via
```
```
onboard sounder modules), 4 (access wired relays via onboard relay modules), 5 (access wired relays via keypads), 11
```
```
(access wireless sounders, single-channel output modules (wireless relays), and keyfobs via the receivers connected to
```
```
the RS-485 bus), 12 (access wired relays via the wired output module connected to the RS-485 bus), 13 (access
```
```
network cameras by login via the network)
```
```
1 (access keypas via wireless network), 3 (access wireless sounders via internal wireless receivers), 4 (access wired
```
```
relays via onboard transmitters), 6 (access card readers via wireless network), 7 (access repeaters via wireless network),
```
```
8 (access keyfobs via wireless network), 9 (access wired relays by connecting wireless receivers with single-channel /
```
```
multi-channel transmitters), 10 (access wired relays by connecting wireless receivers with wireless output modules), 13
```
```
(access network cameras by login via the network)
```
Request URL
GET /ISAPI/Event/notification/alertStream?deployID=<deployID>
Query Parameter
Parameter
Name
Parameter
Type Description
```
deployID string 0 (client-side arming), 1 (real-time arming). Defaults to the client-side arming whendelpoyID does not exist.
```
Request Message
None
Response Message
The hybrid security control panel can access peripherals in the following ways:
The wireless security control panel can access peripherals in the following ways:
12 API Reference
```
12.1 Device Management (General)
```
12.1.1 Event Subscription Management
12.1.1.1 Establish arming connection
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<EventNotificationAlert xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, event massage, attr:version{req, string, protocolVersion}-->
```
<ipAddress>
<!--ro, opt, string, IPV4 address of the device that triggers an alarm-->test
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPV6 address of the device that triggers an alarm-->test
</ipv6Address>
<portNo>
<!--ro, opt, int, port No. of the device that triggers an alarm, range:[0,65535]-->0
</portNo>
<protocol>
```
<!--ro, opt, enum, protocol type, subType:string, desc:"HTTP", "HTTPS", "EHome" (ISUP)-->HTTP
```
</protocol>
<macAddress>
<!--ro, opt, string, MAC address, range:[0,17]-->00-16-EA-AE-3C-40
</macAddress>
<channelID>
<!--ro, opt, int, channel No. of the device that triggers an alarm, range:[0,65535]-->1
</channelID>
<dateTime>
<!--ro, req, datetime, alarm triggering time-->1970-01-01T00:00:00+08:00
</dateTime>
<activePostCount>
<!--ro, req, int, the uploading times of the same alarm, range:[0,65535]-->0
</activePostCount>
<eventType>
<!--ro, req, string, heartbeat type-->test
</eventType>
<eventState>
```
<!--ro, req, enum, event status, subType:string, desc:"active" (triggered), "inactive" (not triggered, the heartbeat data)-->active
```
</eventState>
<eventDescription>
<!--ro, req, string, event description, range:[0,128]-->test
</eventDescription>
</EventNotificationAlert>
Request URL
GET /ISAPI/Event/notification/subscribeEventCap
Query Parameter
None
Request Message
None
Response Message
12.1.1.2 Get the alarm/event subscription capability
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<SubscribeEventCap xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, picture uploading modes of all events which contain pictures, attr:version{req, string, protocolVersion}-->
```
<heartbeat min="1" max="180">
```
<!--ro, opt, int, heartbeat interval time, range:[1,180], unit:s, attr:min{req, int},max{req, int}-->1
```
</heartbeat>
<channelMode opt="all,list">
```
<!--ro, opt, enum, channel subscription mode, subType:string, attr:opt{req, string}, desc:"all" (subscribe to all channels), "list" (subscribe to
```
```
channels according to channel list)-->list
```
</channelMode>
<eventMode opt="all,list,allAndChild">
```
<!--ro, req, enum, event subscription mode, subType:string, attr:opt{req, string}, desc:"all" (subscribe to all alarms/events), "list" (subscribe to
```
```
specified alarms/events)-->list
```
</eventMode>
<EventList>
<!--ro, opt, array, event type list for subscription, subType:object, desc:this node is valid when eventMode is "list"-->
<Event>
<!--ro, opt, object, subscription of a specified alarm/event-->
<type>
```
<!--ro, req, enum, event type, subType:string, desc:refer to event type list (eventType): "ADAS"(advanced driving assistance system), "ADASAlarm"
```
```
(advanced driving assistance alarm), "AID"(traffic incident detection), "ANPR"(automatic number plate recognition), "AccessControllerEvent" (access
```
```
controller event), "CDsStatus" (CD burning status), "DBD"(driving behavior detection) "GPSUpload" (GPS information upload), "HFPD"(frequently appeared
```
```
person detection), "IO"(I/O alarm), "IOTD" (IoT device detection), "LES" (logistics scanning event), "LFPD"(rarely appeared person detection), "PALMismatch"
```
```
(video standard mismatch), "PIR", "PeopleCounting" (people counting), "PeopleNumChange" (people number change detection), "Standup"(standing up detection),
```
```
"TMA"(thermometry alarm), "TMPA"(temperature measurement pre-alarm), "VMD"(motion detection), "abnormalAcceleration", "abnormalDriving", "advReachHeight",
```
```
"alarmResult", "attendance", "attendedBaggage", "audioAbnormal", "audioexception", "behaviorResult"(abnormal event detection), "blindSpotDetection"(blind
```
```
spot detection alarm), "cardMatch", "changedStatus", "collision", "containerDetection", "crowdSituationAnalysis", "databaseException", "defocus"(defocus
```
```
detection), "diskUnformat"(disk unformatted), "diskerror", "diskfull", "driverConditionMonitor"(driver status monitoring alarm); "emergencyAlarm",
```
```
"faceCapture", "faceSnapModeling", "facedetection", "failDown"(People Falling Down), "faultAlarm", "fielddetection"(intrusion detection), "fireDetection",
```
```
"fireEscapeDetection", "flowOverrun", "framesPeopleCounting", "getUp"(getting up detection), "group" (people gathering), "hdBadBlock"(HDD bad sector
```
```
detection event), "hdImpact"(HDD impact detection event), "heatmap"(heat map alarm), "highHDTemperature"(HDD high temperature detection event),
```
```
"highTempAlarm"(HDD high temperature alarm), "hotSpare"(hot spare exception), "illaccess"(invalid access), "ipcTransferAbnormal", "ipconflict"(IP address
```
```
conflicts), "keyPersonGetUp"(key person getting up detection), "leavePosition"(absence detection), "linedetection"(line crossing detection),
```
```
"listSyncException"(list synchronization exception), "loitering"(loitering detection), "lowHDTemperature"(HDD low temperature detection event),
```
```
"mixedTargetDetection"(multi-target-type detection), "modelError", "nicbroken"(network disconnected), "nodeOffline"(node disconnected),
```
```
"nonPoliceIntrusion", "overSpeed"(overspeed alarm), "overtimeTarry"(staying overtime detection), "parking"(parking detection), "peopleNumChange",
```
```
"peopleNumCounting", "personAbnormalAlarm"(person ID exception alarm), "personDensityDetection", "personQueueCounting", "personQueueDetection",
```
```
"personQueueRealTime"(real-time data of people queuing-up detection), "personQueueTime"(waiting time detection), "playCellphone"(playing mobile phone
```
```
detection), "pocException"(video exception), "poe"(POE power exception), "policeAbsent", "radarAlarm", "radarFieldDetection", "radarLineDetection",
```
```
"radarPerimeterRule"(radar rule data), "radarTargetDetection", "radarVideoDetection"(radar-assisted target detection), "raidException", "rapidMove",
```
```
"reachHeight"(climbing detection), "recordCycleAbnormal"(insufficient recording period), "recordException", "regionEntrance", "regionExiting", "retention"
```
```
(people overstay detection), "rollover", "running"(people running), "safetyHelmetDetection"(hard hat detection), "scenechangedetection", "sensorAlarm"
```
```
(angular acceleration alarm), "severeHDFailure"(HDD major fault detection), "shelteralarm"(video tampering alarm), "shipsDetection", "sitQuietly"(sitting
```
```
detection), "smokeAndFireDetection", "smokeDetection", "softIO", "spacingChange"(distance exception), "sysStorFull"(storaging full alarm of cluster system),
```
```
"takingElevatorDetection"(elevator electric moped detection), "targetCapture", "temperature"(temperature difference alarm), "thermometry"(temperature
```
```
alarm), "thirdPartyException", "toiletTarry"(in-toilet overtime detection), "tollCodeInfo"(QR code information report), "tossing"(thrown object detection),
```
```
"unattendedBaggage", "vehicleMatchResult"(uploading list alarms), "vehicleRcogResult", "versionAbnormal"(cluster version exception), "videoException",
```
```
"videoloss", "violationAlarm", "violentMotion"(violent motion detection), "yardTarry"(playground overstay detection), "AccessControllerEvent",
```
```
"IDCardInfoEvent", "FaceTemperatureMeasurementEvent", "QRCodeEvent"(QR code event of access control), "CertificateCaptureEvent"(person ID capture comparison
```
```
event), "UncertificateCompareEvent", "ConsumptionAndTransactionRecordEvent", "ConsumptionEvent", "TFS" (traffic enforcement event),
```
```
"TransactionRecordEvent", "HealthInfoSyncQuery" (health information search event), "SetMealQuery"(searching consumption set meals), "ConsumptionStatusQuery"
```
```
(searching the consumption status), "certificateRevocation" (certificate expiry), "humanBodyComparison" (human body comparison),
```
```
"regionTargetNumberCounting" (regional target statistics)-->mixedTargetDetection
```
</type>
<minorAlarm opt="0x400,0x401,0x402,0x403">
```
<!--ro, opt, string, minor alarm type, attr:opt{req, string}, desc:"IDCardInfoEvent" is required when the type of event is "AccessControllerEvent"--
```
>0x400,0x401
</minorAlarm>
<minorException opt="0x400,0x401,0x402,0x403">
```
<!--ro, opt, string, minor exception type, attr:opt{req, string}, desc:"IDCardInfoEvent" is required when the type of event is
```
"AccessControllerEvent"-->0x400,0x401
</minorException>
<minorOperation opt="0x400,0x401,0x402,0x403">
```
<!--ro, opt, string, minor operation type, attr:opt{req, string}, desc:"IDCardInfoEvent" is required when the type of event is
```
"AccessControllerEvent"-->0x400,0x401
</minorOperation>
<minorEvent opt="0x01,0x02,0x03,0x04">
```
<!--ro, opt, string, minor event type, attr:opt{req, string}, desc:"IDCardInfoEvent" is required when the type of event is "AccessControllerEvent"--
```
>0x400,0x401
</minorEvent>
<pictureURLType opt="binary,localURL,cloudStorageURL,multipart" def="cloudStorageURL">
```
<!--ro, opt, enum, alarm picture format, subType:string, attr:opt{req, string},def{req, string}, desc:"binary" (binary), "localURL" (device local
```
```
URL), "cloudStorageURL" (cloud storage URL)-->cloudStorageURL
```
</pictureURLType>
</Event>
</EventList>
<isSupportModifySubscribeEvent>
<!--ro, opt, bool, whether the device supports the management of arming subscription, desc:related API: /ISAPI/Event/notification/subscribeEvent/<ID>--
>true
</isSupportModifySubscribeEvent>
</SubscribeEventCap>
Request URL
PUT /ISAPI/Event/notification/unSubscribeEvent?ID=<subscribeEventID>
12.1.1.3 Cancel subscribing alarm/event
Hikvision co MMC
adil@hikvision.co.az
Query Parameter
Parameter
Name
Parameter
Type Description
subscribeEventID string
Subscription event ID, which should match the id field in the SubscribeEventResponse
of the response message from the POST /ISAPI/Event/notification/subscribeEvent?
```
deployID=.This field is optional. When the protocol is
```
/ISAPI/Event/notification/unSubscribeEvent, it indicates that all subscription links are
to be unsubscribed. When the protocol is
/ISAPI/Event/notification/unSubscribeEvent?ID=XXX, it indicates that a specific
subscription link is to be unsubscribed.
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, opt, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, which describes the error in details, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
<description>
<!--ro, opt, string, custom error message description, range:[0,1024], desc:the custom error message description returned by the application is used to
quickly identify and evaluate issues-->badXmlFormat
</description>
<MErrCode>
<!--ro, opt, string, error codes categorized by functional modules, desc:all general error codes are in the range of this field-->0x00000000
</MErrCode>
<MErrDevSelfEx>
<!--ro, opt, string, error codes categorized by functional modules, desc:N/A-->0x00000000
</MErrDevSelfEx>
</ResponseStatus>
```
EventType:heartBeat
```
12.1.1.4 Event subscription heartbeatHikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<EventNotificationAlert xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, alarm message, attr:version{opt, string, protocolVersion}-->
```
<ipAddress>
<!--ro, req, string, IPv4 address of the device that triggers the alarm-->172.6.64.7
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address of the device that triggers the alarm-->1080:0:0:0:8:800:200C:417A
</ipv6Address>
<portNo>
<!--ro, opt, int, communication port No. of the device that triggers the alarm-->80
</portNo>
<protocol>
<!--ro, opt, string, transmission communication protocol type, range:[0,64], desc:when ISAPI protocol is transmitted via HCNetSDK, the channel No. is
the video channel No. of private protocol. When ISAPI protocol is transmitted via EZ protocol, the channel No. is the video channel No. of EZ protocol. When
ISAPI protocol is transmitted via ISUP, the channel No. is the video channel No. of ISUP-->HTTP
</protocol>
<macAddress>
<!--ro, opt, string, MAC address-->01:17:24:45:D9:F4
</macAddress>
<channelID>
<!--ro, opt, int, channel No. of the device that triggers the alarm, desc:video channel No. that triggers the alarm-->1
</channelID>
<dateTime>
<!--ro, req, datetime, alarm trigger time-->2004-05-03T17:30:08+08:00
</dateTime>
<activePostCount>
<!--ro, opt, int, times that the same alarm has been uploaded, desc:event triggering frequency-->1
</activePostCount>
<eventType>
<!--ro, req, string, event type-->heartBeat
</eventType>
<eventState>
```
<!--ro, req, enum, event status, subType:string, desc:for durative event: "active" (valid), "inactive" (invalid)-->active
```
</eventState>
<eventDescription>
<!--ro, req, string, event description-->heartBeat
</eventDescription>
<channelName>
<!--ro, opt, string, channel name, range:[1,64]-->test
</channelName>
<deviceID>
```
<!--ro, opt, string, device ID, desc:it should be returned for ISUP alarms, e.g., test0123 (Ehome2.0, Ehome4.0, and ISUP5.0)-->12345
```
</deviceID>
</EventNotificationAlert>
Request URL
GET /ISAPI/System/onlineUpgrade/capabilities
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<OnlineUpgradeCap xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, online upgrade, attr:version{req, string, protocolVersion}-->
```
<firmwareNum max="10">
```
<!--ro, req, int, number of supported online upgrade packages, attr:max{req, int}-->1
```
</firmwareNum>
<firmwareCode max="256">
```
<!--ro, req, int, maximum length of firmware ID, attr:max{req, int}-->1
```
</firmwareCode>
<firmwareVersion max="64">
```
<!--ro, req, int, maximum length of version, attr:max{req, int}-->1
```
</firmwareVersion>
<firmwareCodeNumOnce max="10">
```
<!--ro, req, int, maximum number of obtained firmware IDs, attr:max{req, int}-->1
```
</firmwareCodeNumOnce>
<upgradePercent min="0" max="100">
```
<!--ro, req, int, upgrade progress capability in percentage, attr:min{req, int},max{req, int}-->1
```
</upgradePercent>
<Version>
<!--ro, opt, object, upgrade package version information-->
<newVersion max="64">
12.1.2 Online Upgrading Management
12.1.2.1 Get the device online upgrade capability
Hikvision co MMC
adil@hikvision.co.az
<newVersion max="64">
```
<!--ro, req, string, version information of the new upgrade package, attr:max{req, int}-->test
```
</newVersion>
<changeLog max="64">
```
<!--ro, req, string, log of the new upgrade package, attr:max{req, int}-->test
```
</changeLog>
</Version>
<rebootAfterUpgrade>
```
<!--ro, opt, enum, upgrade options after device reboot, subType:string, desc:"auto" (auto upgrade), "manual" (manual upgrade)-->auto
```
</rebootAfterUpgrade>
<DeviceParameter>
<!--ro, opt, object, online upgrade parameters-->
<isSupportAutoDownloadPackage>
<!--ro, opt, bool, whether it supports automatic download of upgrade package-->true
</isSupportAutoDownloadPackage>
<notSupportAutoUpgrade>
<!--ro, opt, bool, whether it no longer supports automatic download of upgrade package and automatic upgrade, desc:corresponding URL: PUT
/ISAPI/System/onlineUpgrade/upgrade-->true
</notSupportAutoUpgrade>
<isSupportTimingUpgrade>
<!--ro, opt, bool, whether it supports scheduled upgrade-->true
</isSupportTimingUpgrade>
</DeviceParameter>
<ManualDownloadPackage>
<!--ro, opt, object, manual download of upgrade package-->
<supportOperation opt="start,cancel,pause,resume">
```
<!--ro, opt, enum, supported operations, subType:string, attr:opt{req, string}, desc:"start", "cancel", "pause", "resume"-->start
```
</supportOperation>
</ManualDownloadPackage>
<isSupportIgnoreCurrentVersion>
<!--ro, opt, bool, whether it supports ignoring the current version-->true
</isSupportIgnoreCurrentVersion>
<UpgradePackageTask>
<!--ro, opt, object, whether the device supports applying upgrade tasks, desc:if this node is returned, it indicates that the following URLs are also
```
supported: /ISAPI/System/onlineUpgrade/task?format=json, /ISAPI/System/onlineUpgrade/status/<ID>-->
```
<isSupportUpgradeModules>
<!--ro, opt, bool, whether the device supports upgrading sub modules-->true
</isSupportUpgradeModules>
<isSupportUpgradeChannels>
<!--ro, opt, bool, whether the device supports upgrading sub channels-->true
</isSupportUpgradeChannels>
<isSupportDownloadStrategy>
<!--ro, opt, bool, whether the device supports strategy parameters of downloading upgrade package, desc:corresponding filed is "downloadStrategy" of
```
URL (/ISAPI/System/onlineUpgrade/task?format=json)-->true
```
</isSupportDownloadStrategy>
<isSupportDelayedUpgradeByDateTime>
<!--ro, opt, bool, whether the device supports delaying the upgrade by time, desc:corresponding filed is "delayedUpgradeDateTime" of URL
```
(/ISAPI/System/onlineUpgrade/task?format=json)-->true
```
</isSupportDelayedUpgradeByDateTime>
<upgradePackageAddressType opt="URL, ftpIPAddress, ftpDomainAddress">
```
<!--ro, opt, string, attr:opt{req, string}-->URL
```
</upgradePackageAddressType>
</UpgradePackageTask>
<isSupportPatrolInspection>
<!--ro, opt, bool, whether the device supports patrol inspection-->true
</isSupportPatrolInspection>
<isSupportBatchUpgrade>
<!--ro, opt, bool, whether the device supports batch online upgrades-->true
</isSupportBatchUpgrade>
<isSupportCancelUpgrade>
<!--ro, opt, bool, whether the device supports canceling online upgrade-->true
</isSupportCancelUpgrade>
<isSupportPackagePause>
<!--ro, opt, bool, whether the device supports pausing upgrade package download, desc:/ISAPI/System/onlineUpgrade/PackagePause?format=json-->true
</isSupportPackagePause>
<isSupportPackageResume>
<!--ro, opt, bool, whether the device supports resuming upgrade package download, desc:/ISAPI/System/onlineUpgrade/PackageResume?format=json-->true
</isSupportPackageResume>
<isSupportCancelUpgradeByTaskID>
<!--ro, opt, bool, whether the device supports canceling online upgrade by task ID, desc:corresponding to the field assignByTaskID of operationType in
URL PUT /ISAPI/System/onlineUpgrade/CancelUpgrade?format=json-->true
</isSupportCancelUpgradeByTaskID>
</OnlineUpgradeCap>
Request URL
GET /ISAPI/System/onlineUpgrade/downloadPackage/status?format=json
Query Parameter
None
Request Message
None
Response Message
12.1.2.2 Get the online upgrade package downloading progress
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"DownloadPackageStatus": {
```
/*ro, req, object, upgrade package downloading status*/
"status": "notDownload",
/*ro, req, enum, download status, subType:string, desc:"notDownload", "downloading", "downloadFailed", "pause", "finish", "incorrectPackage"
```
(incorrect upgrade package format), "hdOperationFailed" (HD operation failed)*/
```
"total": 0.0,
/*ro, opt, float, upgrade package total size, desc:unit: MB, corrects to one decimal place*/
"remain": 0.0,
/*ro, opt, float, remaining space, desc:unit: MB, corrects to one decimal place*/
"speed": 0.0,
/*ro, opt, float, download speed, desc:unit: MB, corrects to one decimal place*/
"remainTime": 0,
/*ro, opt, int, estimated remaining time, unit:s*/
"progress": 0
/*ro, req, int, progress, range:[0,100]*/
```
}
```
```
}
```
Request URL
PUT /ISAPI/System/onlineUpgrade/downloadPackage?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:it is required when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/System/onlineUpgrade/status
Query Parameter
None
Request Message
None
Response Message
12.1.2.3 Start to download upgrade package to device
12.1.2.4 Get the online upgrade progress of device
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<OnlineUpgradeStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, online upgrade status, attr:version{req, string, protocolVersion}-->
```
<status>
```
<!--ro, req, enum, online upgrade status, subType:string, desc:"notUpgrade" (not upgraded), "upgrading", "successful" (upgraded), "languageMismatch"
```
```
(language mismatch), "writeFlashError" (failed to write to flash), "packageTypeMismatch" (upgrade package type mismatch), "packageVersionMismatch" (upgrade
```
```
version mismatch), "netUnreachable" (network disconnected), "unknownError" (unknown error), "engineVersionMismatch" (mismatch of upgrade package engine
```
```
version)-->notUpgrade
```
</status>
<percent>
<!--ro, req, int, current upgrade progress in percentage, range:[0,100]-->1
</percent>
<onlineUpdateDevInfoList>
<!--ro, opt, object, online upgrade device information, desc:containing the online upgrade status of sub devices, sub modules, or sub channels-->
<onlineUpdateDevInfo>
<!--ro, opt, object, online upgrade device information-->
<moduleType>
```
<!--ro, req, enum, module type, subType:string, desc:"keypad", "detector", "cardReader" (card reader), "siren" (sounder), "relay", "transmitter"
```
```
(transmitter), "remoteCtrl" (remote control),"repeater" (repeater), "SSD", "extensionModule" (extension module)-->keypad
```
</moduleType>
<moduleID>
<!--ro, req, int, module ID, range:[1,128], step:1-->1
</moduleID>
<model>
<!--ro, opt, string, model, range:[1,32]-->test
</model>
<status>
```
<!--ro, opt, enum, upgrade status, subType:string, desc:"allowance" (upgradeable, the upgrade command is not triggered), "ready" (waiting for
```
```
upgrade, the upgrade command has been triggered), "upgriding" (upgrading), "success" (upgraded), "failed" (upgrade failed)-->allowance
```
</status>
<percent>
<!--ro, opt, int, current upgrade percentage, range:[0,100]-->1
</percent>
<updateTime>
<!--ro, opt, datetime, upgrade completion time-->2004-05-03T17:30:08+08:00
</updateTime>
</onlineUpdateDevInfo>
</onlineUpdateDevInfoList>
</OnlineUpgradeStatus>
Request URL
GET /ISAPI/System/Serial/capabilities
Query Parameter
None
Request Message
None
Response Message
12.1.3 Serial Port Management
12.1.3.1 Get the serial port capability of the device
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<SerialCap xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, range of RS-485 serial port numbers supported by the device, attr:version{req, string, protocolVersion}-->
```
<rs485PortNums>
<!--ro, opt, int, the maximum number of RS-485 serial ports supported by the device-->0
</rs485PortNums>
<supportRS232Config>
<!--ro, opt, bool, whether the device supports configuring parameters of RS-232 serial ports-->true
</supportRS232Config>
<rs422PortNums>
<!--ro, opt, int, the maximum number of RS-422 serial ports supported by the device-->0
</rs422PortNums>
<rs232PortNums>
<!--ro, opt, int, the maximum number of RS-232 serial ports supported by the device-->0
</rs232PortNums>
<rs485WorkMode opt="Led, CaptureTrigger,transparent">
```
<!--ro, opt, string, range of RS-485 serial port No. supported by the device, attr:opt{req, string}-->test
```
</rs485WorkMode>
<rs232SerialNumber opt="1,2,3">
```
<!--ro, opt, int, range of RS-232 serial port numbers supported by the device, attr:opt{req, string}-->1
```
</rs232SerialNumber>
<rs485SerialNumber opt="4,5,6">
```
<!--ro, opt, int, range of RS-485 serial port numbers supported by the device, attr:opt{req, string}-->1
```
</rs485SerialNumber>
<isSupportAuthenticationService>
<!--ro, opt, bool, whether the device supports the serial port authentication service-->true
</isSupportAuthenticationService>
<isSupportDeviceInfo>
<!--ro, opt, bool, whether the device supports configuring the information about the serial port device-->true
</isSupportDeviceInfo>
<isSupportSearchDeviceInfoRelations>
<!--ro, opt, bool, whether the device supports searching the linkage information of the serial port device-->true
</isSupportSearchDeviceInfoRelations>
</SerialCap>
Request URL
GET /ISAPI/System/Serial/ports/<portID>/capabilities
Query Parameter
Parameter Name Parameter Type Description
portID string --
Request Message
None
Response Message
12.1.3.2 Get the capability of a specific serial port
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<SerialPort xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, port No., attr:version{req, string, protocolVersion}-->
```
<id>
<!--ro, req, int, ID-->0
</id>
<enabled opt="true,false">
```
<!--ro, opt, bool, whether to enable, attr:opt{req, string}-->true
```
</enabled>
<serialPortType opt="RS485,RS422,RS232">
```
<!--ro, opt, string, serial port type, attr:opt{req, string}-->RS485
```
</serialPortType>
<serialAddress min="0" max="10">
```
<!--ro, opt, int, serial port address, attr:min{req, int},max{req, int}, desc:serial port address-->1
```
</serialAddress>
<duplexMode opt="half,full">
```
<!--ro, opt, string, duplex mode of the serial port, attr:opt{req, string}-->half
```
</duplexMode>
<direction opt="monodirectional,bdirectional">
```
<!--ro, opt, string, attr:opt{req, string}-->monodirectional
```
</direction>
<baudRate opt="1200,2400,4800,9600,19200,38400,57600,115200">
```
<!--ro, opt, int, attr:opt{req, string}-->1200
```
</baudRate>
<dataBits opt="6,7,8">
```
<!--ro, opt, int, attr:opt{req, string}-->6
```
</dataBits>
<parityType opt="none,even,odd,mark,space">
```
<!--ro, opt, string, attr:opt{req, string}-->none
```
</parityType>
<stopBits opt="1,1.5,2">
```
<!--ro, opt, string, stop bit, attr:opt{req, string}-->1
```
</stopBits>
<flowCtrl opt="none,software,hardware">
```
<!--ro, opt, string, flowCtrl, attr:opt{req, string}-->none
```
</flowCtrl>
<deviceName min="0" max="32">
```
<!--ro, opt, string, attr:min{req, int},max{req, int}-->test
```
</deviceName>
<mode opt="readerMode,clientMode,externMode,stairsControl,accessControlHost,disabled,custom,cardReceiver,QRCodeReader">
```
<!--ro, opt, string, working mode, attr:opt{req, string}-->readerMode
```
</mode>
<outputDataType opt="cardNo,employeeNo,auto">
```
<!--ro, opt, string, output data type, attr:opt{req, string}, desc:data type output from the door station to the elevator controller: floorNumber (floor
```
```
No.,default),cardNo (card No.)-->cardNo
```
</outputDataType>
<stairsControl>
<!--ro, opt, object, elevator control parameters-->
<outputDataType opt="floorNumber,cardNo">
```
<!--ro, opt, enum, data type output from the door station to the elevator controller, subType:string, attr:opt{req, string}, desc:floorNumber (floor
```
```
No.,default),cardNo (card No.)-->floorNumber
```
</outputDataType>
</stairsControl>
</SerialPort>
Request URL
PUT /ISAPI/System/Serial/ports/<portID>?permissionController=<indexID>&childDevID=
<childDevID>&deviceIndex=<deviceIndex>
Query Parameter
Parameter Name Parameter Type Description
portID string --
indexID string --
childDevID string --
deviceIndex string --
Request Message
<?xml version="1.0" encoding="UTF-8"?>
<SerialPort xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--opt, object, port, attr:version{req, string, protocolVersion}-->
```
<id>
<!--req, int, serial port ID-->0
</id>
<enabled>
12.1.3.3 Set the parameters of a specific serial port supported by the device
Hikvision co MMC
adil@hikvision.co.az
<!--opt, bool, whether to enable the function-->true
</enabled>
<encryptKey>
<!--opt, string-->test
</encryptKey>
<serialNumber>
<!--opt, int, serial No.-->0
</serialNumber>
<serialPortType>
<!--opt, enum, serial port type: "RS485","RS422","RS232", subType:string, desc:serial port type: "RS485","RS422","RS232"-->RS485
</serialPortType>
<serialAddress>
<!--opt, int-->1
</serialAddress>
<duplexMode>
<!--opt, enum, duplex mode of the serial port, subType:string, desc:"half", "full”-->half
</duplexMode>
<direction>
<!--opt, enum, "monodirectional,bdirectional", subType:string, desc:"monodirectional, bdirectional”-->monodirectional
</direction>
<baudRate>
<!--opt, enum, subType:int-->2400
</baudRate>
<dataBits>
<!--opt, int-->6
</dataBits>
<parityType>
<!--opt, enum, parity type, subType:string, desc:"none, even, odd, mark, space”-->none
</parityType>
<stopBits>
<!--opt, string, stop bit: "1,1.5,2"-->1
</stopBits>
<workMode>
<!--opt, enum, work mode, subType:string, desc:working mode: "console","transparent","audiomixer","stairsControl"-elevator control,"cardReader"-card
reader,"disabled","custom". This node is required only when <serialPortType> is set to "RS232"-->console
</workMode>
<flowCtrl>
<!--opt, enum, "none,software,hardware", subType:string, desc:"none, software, hardware”-->none
</flowCtrl>
<rs485WorkMode>
<!--opt, enum, working mode of RS-485 serial port, which is used for LED display or triggering transmission of captured pictures: "Led, CaptureTrigger".
```
This node is valid only when <serialPortType> is "RS485", subType:string, dep:or,{$.SerialPort.serialPortType,eq,RS485}, desc:working mode of RS-485 serial
```
port,which is used for LED display or triggering transmission of captured pictures: "Led,CaptureTrigger". This node is valid only when <serialPortType> is
"RS485"-->sensor
</rs485WorkMode>
<copyToAll>
<!--opt, bool-->true
</copyToAll>
<deviceName>
<!--ro, opt, string-->test
</deviceName>
<deviceProtocol>
<!--ro, opt, int-->1
</deviceProtocol>
<mode>
<!--opt, enum, work mode, subType:string, desc:deq,working mode: "readerMode,clientMode,externMode,accessControlHost,disabled",this node is valid only
when <serialPortType> is "RS485"-->readerMode
</mode>
<outputDataType>
```
<!--opt, enum, output data type, subType:string, dep:and,{$.SerialPort.mode,eq,accessControlHost}, desc:"cardNo,employeeNo", this node is valid when
```
<mode>is "accessControlHost”-->cardNo
</outputDataType>
<isVariable>
<!--opt, bool-->true
</isVariable>
<PTZInfo>
<!--opt, object, PTZ information-->
<bindChannelNo>
<!--req, int-->0
</bindChannelNo>
<PTZProtocolList>
<!--req, object-->
<PTZProtocol>
<!--opt, object-->
<id>
<!--req, int, serial port ID-->0
</id>
<protoDesc>
<!--req, string-->test
</protoDesc>
</PTZProtocol>
</PTZProtocolList>
</PTZInfo>
<ScreenCtrlInfo>
<!--opt, object-->
<ScreenCtrlProtoList>
<!--req, object-->
<ScreenCtrlProto>
<!--opt, object-->
<id>
<!--req, int, serial port ID-->0
</id>
<protoDesc>
<!--req, string-->test
Hikvision co MMC
adil@hikvision.co.az
<!--req, string-->test
</protoDesc>
</ScreenCtrlProto>
</ScreenCtrlProtoList>
</ScreenCtrlInfo>
<MatrixCtrlInfo>
<!--opt, object-->
<MatrixCtrlProtoList>
<!--req, object-->
<MatrixCtrlProto>
<!--opt, object-->
<id>
<!--req, int, serial port ID-->0
</id>
<protoDesc>
<!--req, string-->test
</protoDesc>
</MatrixCtrlProto>
</MatrixCtrlProtoList>
</MatrixCtrlInfo>
<KeyBoardCtrlInfo>
<!--opt, object-->
<KeyBoardCtrlProtoList>
<!--req, object-->
<KeyBoardCtrlProto>
<!--opt, object-->
<id>
<!--req, int, serial port ID-->0
</id>
<protoDesc>
<!--req, string-->test
</protoDesc>
</KeyBoardCtrlProto>
</KeyBoardCtrlProtoList>
</KeyBoardCtrlInfo>
<ControlAddress>
<!--opt, object-->
<enabled>
<!--req, bool, whether to enable the function-->true
</enabled>
<address>
<!--req, int, address, range:[0,255]-->1
</address>
</ControlAddress>
<SensorCtrlList>
<!--opt, object-->
<Sensor>
<!--opt, object-->
<id>
<!--req, int, ID, range:[1,3]-->1
</id>
<name>
<!--req, string, sensor name, range:[1,32]-->visibilitySensor
</name>
<enabled>
<!--req, bool, whether to enable the function, desc:whether to enable the serial port: "true,false"-->false
</enabled>
</Sensor>
</SensorCtrlList>
<stairsControl>
<!--opt, object, elevator control parameters, this node is valid when the value of the node <mode> is stairsControl, dep:and,
```
{$.SerialPort.mode,eq,stairsControl}-->
```
<outputDataType>
<!--opt, enum, output data type, subType:string, desc:"cardNo,employeeNo", this node is valid when <mode>is "accessControlHost”-->floorNumber
</outputDataType>
</stairsControl>
<comMode>
<!--opt, enum, subType:string-->active
</comMode>
<ModbusRTU>
```
<!--opt, object, dep:and,{$.SerialPort.rs485WorkMode,eq,ModbusRTU}-->
```
<ModbusRTUBaudRate>
<!--opt, enum, subType:string-->9600
</ModbusRTUBaudRate>
<ModbusRTUDataBits>
<!--opt, enum, subType:int-->6
</ModbusRTUDataBits>
<ModbusRTUParityType>
<!--opt, enum, subType:string-->none
</ModbusRTUParityType>
<ModbusRTUStopBits>
<!--opt, enum, subType:string-->1
</ModbusRTUStopBits>
<ModbusRTUFlowCtrl>
<!--opt, enum, subType:string-->none
</ModbusRTUFlowCtrl>
<decoderAddress>
<!--opt, int, range:[0,255]-->0
</decoderAddress>
</ModbusRTU>
<accessName>
<!--opt, string, range:[1,32]-->test
</accessName>
<serialPortUse>
Hikvision co MMC
adil@hikvision.co.az
<serialPortUse>
<!--opt, enum, subType:string-->acquisition
</serialPortUse>
<acquisitionProtocol>
```
<!--opt, enum, subType:string, dep:and,{$.SerialPort.serialPortUse,eq,acquisition}-->modbus
```
</acquisitionProtocol>
<serialProtocol>
<!--opt, enum, subType:string-->GB26875
</serialProtocol>
<SupplementLightList>
```
<!--opt, array, subType:object, dep:and,{$.SerialPort.rs485WorkMode,eq,supplementLight}-->
```
<SupplementLight>
<!--opt, object-->
<SupplementLightID>
<!--req, int, range:[1,5]-->1
</SupplementLightID>
</SupplementLight>
</SupplementLightList>
<cardReaderType>
<!--opt, enum, subType:string-->K1108AM
</cardReaderType>
</SerialPort>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status description, subType:string, desc:“OK” (succeeded), “Device Busy”, “Device Error”, “Invalid Operation”, “Invalid XML Format”,
```
```
“Invalid XML Content”, “Reboot” (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, error reason description in detail, desc:error reason description in detail-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/System/Serial/ports/<portID>?permissionController=<indexID>&childDevID=
<childDevID>&deviceIndex=<deviceIndex>
Query Parameter
Parameter
Name
Parameter
Type Description
portID string --
indexID string
```
0 (main permission controller), 1 (sub permission controller) When this parameter does not
```
```
exist, it indicates getting the serial port information of the main permission controller (i.e.,
```
```
the device serial port information).
```
childDevID string --
deviceIndex string
For C60S devices connected to multiple LED sending cards, the URL needs to include
```
deviceIndex= to distinguish which LED sending card to operate on. The value of
```
deviceIndex is the value of "id" when "portType" is LED and can be obtained via GET
/ISAPI/DisplayDev/Video/outputs/channels.
Request Message
None
Response Message
12.1.3.4 Get the parameters of a specific port supported by the device
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<SerialPort xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, port, attr:version{req, string, protocolVersion}-->
```
<id>
<!--ro, req, int, serial port ID-->0
</id>
<enabled>
<!--ro, opt, bool, whether to enable the serial port-->true
</enabled>
<serialPortType>
<!--ro, opt, enum, serial port type, subType:string, desc:"RS485", "RS422", "RS232”-->RS485
</serialPortType>
<serialAddress>
<!--ro, opt, int-->1
</serialAddress>
<duplexMode>
<!--ro, opt, enum, duplex mode of the serial port, subType:string, desc:"half", "full”-->half
</duplexMode>
<direction>
<!--ro, opt, enum, "monodirectional,bdirectional", subType:string, desc:"monodirectional”, “bdirectional”-->monodirectional
</direction>
<baudRate>
<!--ro, opt, enum, subType:int-->2400
</baudRate>
<dataBits>
<!--ro, opt, int-->6
</dataBits>
<parityType>
<!--ro, opt, enum, parity type, subType:string, desc:parity type: "none,even,odd,mark,space"-->none
</parityType>
<stopBits>
<!--ro, opt, enum, stop bit, subType:string, desc:stop bit-->1
</stopBits>
<flowCtrl>
<!--ro, opt, enum, "none,software,hardware", subType:string, desc:"none”, “software”, “hardware”-->none
</flowCtrl>
<deviceName>
<!--ro, opt, string-->test
</deviceName>
<mode>
<!--ro, opt, enum, working mode, subType:string, desc:deq,working mode: "readerMode,clientMode,externMode,accessControlHost,disabled",this node is valid
only when <serialPortType> is "RS485"-->readerMode
</mode>
</SerialPort>
Request URL
GET /ISAPI/System/Serial/ports?permissionController=<indexID>&deviceIndex=<deviceIndex>
Query Parameter
Parameter
Name
Parameter
Type Description
indexID string
```
0 (main permission controller), 1 (sub permission controller) If this parameter does not
```
exist, it indicates getting the serial port information of main permission controller, that is,
the serial port information of the device.
deviceIndex string
For C60S device connecting multiple LED sending cards, the URL needs to include the
parameter deviceIndex= to specify which LED sending card to operate on. The value of
deviceIndex is the value of "id" when "portType" is LED and can be obtained via GET
/ISAPI/DisplayDev/Video/outputs/channels.
Request Message
None
Response Message
12.1.3.5 Get the list of serial ports supported by the device
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<SerialPortList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, array, subType:object, attr:version{req, string, protocolVersion}-->
```
<SerialPort>
<!--ro, opt, object-->
<id>
<!--ro, req, int-->0
</id>
<enabled>
<!--ro, opt, bool-->true
</enabled>
<serialPortType>
<!--ro, opt, enum, subType:string-->RS485
</serialPortType>
<serialAddress>
<!--ro, opt, int-->1
</serialAddress>
<duplexMode>
<!--ro, opt, enum, subType:string-->half
</duplexMode>
<direction>
<!--ro, opt, enum, subType:string-->monodirectional
</direction>
<baudRate>
<!--ro, opt, enum, subType:int-->2400
</baudRate>
<dataBits>
<!--ro, opt, int-->6
</dataBits>
<parityType>
<!--ro, opt, enum, subType:string-->none
</parityType>
<stopBits>
<!--ro, opt, enum, subType:string-->1
</stopBits>
<flowCtrl>
<!--ro, opt, enum, subType:string-->none
</flowCtrl>
<deviceName>
<!--ro, opt, string-->test
</deviceName>
<mode>
<!--ro, opt, enum, subType:string-->readerMode
</mode>
</SerialPort>
</SerialPortList>
Request URL
GET /ISAPI/ContentMgmt/capabilities
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<RacmCap xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, device storage capability, attr:version{req, string, protocolVersion}-->
```
<isSupportLogSearch>
<!--ro, opt, bool, whether it supports log search-->true
</isSupportLogSearch>
</RacmCap>
Request URL
GET /ISAPI/Security/capabilities?username=<userName>&deviceIndex=<deviceIndex>
Query Parameter
12.1.4 System Maintenance
12.1.4.1 Get the storage capability of the device
12.1.4.2 Get the system security capability
Hikvision co MMC
adil@hikvision.co.az
Parameter
Name
Parameter
Type Description
userName string user name
deviceIndex string
For centralized splicing controllers connecting to LED sending cards, the URL needs to
include the parameter deviceIndex= to specify LED sending card The value of deviceIndex is
the value of "id" when "portType" is LED and can be obtained via GET
/ISAPI/DisplayDev/Video/outputs/channels.
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<SecurityCap xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, system security capability, attr:version{req, string, protocolVersion}-->
```
<supportUserNums>
<!--ro, opt, int, supported maximum number of users-->0
</supportUserNums>
<userBondIpNums>
<!--ro, opt, int, supported maximum number of IP addresses that can be bound-->0
</userBondIpNums>
<userBondMacNums>
<!--ro, opt, int, supported maximum number of MAC addresses that can be bound-->0
</userBondMacNums>
<isSupCertificate>
<!--ro, opt, bool, whether the device supports authentication-->true
</isSupCertificate>
<issupIllegalLoginLock>
<!--ro, opt, bool, whether the device supports locking login-->true
</issupIllegalLoginLock>
<isSupportOnlineUser>
<!--ro, opt, bool, whether the device supports the online user configuration-->true
</isSupportOnlineUser>
<isSupportAnonymous>
<!--ro, opt, bool, whether the device supports anonymous login-->true
</isSupportAnonymous>
<isSupportStreamEncryption>
<!--ro, opt, bool, whether the device supports stream encryption-->true
</isSupportStreamEncryption>
<securityVersion opt="1,2,3,4">
```
<!--ro, opt, string, encryption capability set, attr:opt{req, string}, desc:the encryption capability of each version consists of two parts: encryption
```
algorithm and the range of encrypted nodes currently 1 refers to AES128 encryption and 2 refers to AES256 encryption, the range of encrypted nodes is
described in each protocol-->1
</securityVersion>
<keyIterateNum>
```
<!--ro, opt, int, secret key iteration times, dep:or,{$.SecurityCap.securityVersion,eq,1},{$.SecurityCap.securityVersion,eq,2}, desc:this node depends
```
on the node securityVersion, the range is between 100 and 1000-->100
</keyIterateNum>
<isSupportUserCheck>
```
<!--ro, opt, bool, whether the device supports verifying the login password when editing (editing/adding/deleting) user parameters, dep:or,
```
```
{$.SecurityCap.securityVersion,eq,0},{$.SecurityCap.securityVersion,eq,1}, desc:it is an added capability, which indicates that whether supporting the login
```
password verification for editing/adding/deleting user parameters, this node depends on the node securityVersion, which means that it is only valid for the
versions that support encrypting the sensitive information-->true
</isSupportUserCheck>
<isSupportGUIDFileDataExport>
<!--ro, opt, bool, whether the device supports exporting the device's GUID file, desc:related URI: /ISAPI/Security/GUIDFileData-->true
</isSupportGUIDFileDataExport>
<isSupportSecurityQuestionConfig>
<!--ro, opt, bool, whether the device supports answering security questions, desc:related URI: /ISAPI/Security/questionConfiguration-->true
</isSupportSecurityQuestionConfig>
<isSupportGetOnlineUserListSC>
<!--ro, opt, bool, whether the device supports searching the online user list, desc:related URI: /ISAPI/Security/onlineUser-->true
</isSupportGetOnlineUserListSC>
<SecurityLimits>
<!--ro, opt, object, capability of configuring security limit parameters-->
<LoginPasswordLenLimit min="1" max="16">
```
<!--ro, opt, string, length limit of the user's login password, attr:min{req, int},max{req, int}-->1
```
</LoginPasswordLenLimit>
<SecurityAnswerLenLimit min="1" max="128">
```
<!--ro, opt, string, length limit of the security question's answer, attr:min{req, int},max{req, int}-->1
```
</SecurityAnswerLenLimit>
</SecurityLimits>
<RSAKeyLength opt="512,1024,2048" def="2048">
```
<!--ro, opt, enum, HTTPS certificate length, subType:int, attr:opt{req, string},def{req, string}, desc:512, 1024, 2048-->2048
```
</RSAKeyLength>
<isSupportONVIFUserManagement>
<!--ro, opt, bool, whether the device supports user management of Open Network Video Interface Protocol-->true
</isSupportONVIFUserManagement>
<WebCertificateCap>
<!--ro, opt, object, HTTP authentication capability, desc:if this node is not returned, it indicates that device supports basic and digest
authentication-->
<CertificateType opt="basic,digest,digest/basic">
Hikvision co MMC
adil@hikvision.co.az
```
<!--ro, req, enum, certificate type, subType:string, attr:opt{req, string}, desc:“basic” (basic authentication), “digest” (digest authentication),
```
```
“digest/basic” (digest/basic authentication)-->basic
```
</CertificateType>
</WebCertificateCap>
<isSupportConfigFileImport>
```
<!--ro, opt, bool, whether the device supports importing the configuration file, desc:true (support), this node is not returned (not support)-->true
```
</isSupportConfigFileImport>
<isSupportConfigFileExport>
```
<!--ro, opt, bool, whether the device supports exporting the configuration file, desc:true (support), this node is not returned (not support)-->true
```
</isSupportConfigFileExport>
<cfgFileSecretKeyLenLimit min="0" max="16">
```
<!--ro, opt, string, length limit of the configuration file's verification key, attr:min{req, int},max{req, int}-->1
```
</cfgFileSecretKeyLenLimit>
<salt>
<!--ro, opt, string, the specific salt used by the user to log in-->test
</salt>
<isSupportDeviceCertificatesManagement>
<!--ro, opt, bool, whether the device supports device certificate management, desc:if this node is not returned, it indicates that device does not
support this function-->true
</isSupportDeviceCertificatesManagement>
<isSupportSecurityEmail>
<!--ro, opt, bool, whether the device supports configuring the security email, desc:if this node is not returned, it indicates that device does not
support this function-->true
</isSupportSecurityEmail>
<isSupportEncryptCertificate>
<!--ro, opt, bool, whether the device supports certificate encryption, desc:/ISAPI/Security/deviceCertificate-->true
</isSupportEncryptCertificate>
<isSupportCertificateCustomID>
<!--ro, opt, bool, whether the device supports using the user's custom ID to configure the certificate-->true
</isSupportCertificateCustomID>
</SecurityCap>
Request URL
GET /ISAPI/System/capabilities?type=<all>
Query Parameter
Parameter Name Parameter Type Description
all string --
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<DeviceCap xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, device system capability, attr:version{opt, string, protocolVersion}-->
```
<isSupportReboot>
<!--ro, opt, bool, whether the device supports rebooting, desc:for traffic devices, this node is required and must be true.-->true
</isSupportReboot>
<isSupportFactoryReset>
<!--ro, opt, bool, whether the device supports restoring to default settings, desc:for traffic devices, this node is required and must be true-->true
</isSupportFactoryReset>
<isSupportUpdatefirmware>
<!--ro, opt, bool, whether the device supports upgrading, desc:for traffic devices, this node is required and must be true-->true
</isSupportUpdatefirmware>
<isSupportDeviceInfo>
<!--ro, opt, bool, whether the device supports getting the device information, desc:for traffic devices, this node is required and must be true-->true
</isSupportDeviceInfo>
<SysCap>
<!--ro, opt, object, system capability-->
<isSupportDst>
```
<!--ro, opt, bool, whether the device supports DST (Daylight Saving Time)-->true
```
</isSupportDst>
<NetworkCap>
<!--ro, opt, object, network capability, desc:related URI: /ISAPI/System/Network/capabilities-->
<isSupportWireless>
<!--ro, req, bool, whether the device supports wireless network-->true
</isSupportWireless>
<isSupportPPPoE>
```
<!--ro, req, bool, whether the device supports PPPoE (Point to Point Protocol over Ethernet)-->true
```
</isSupportPPPoE>
<isSupportBond>
```
<!--ro, req, bool, whether the device supports NIC (Network Interface Card) bonding-->true
```
</isSupportBond>
<isSupport802_1x>
<!--ro, req, bool, whether the device supports 802.1x protocol-->true
</isSupport802_1x>
<isSupportNtp>
```
<!--ro, opt, bool, whether the device supports NTP (Network Time Protocol)-->true
```
</isSupportNtp>
12.1.4.3 Get device system capability
Hikvision co MMC
adil@hikvision.co.az
</isSupportNtp>
<isSupportFtp>
```
<!--ro, opt, bool, whether the device supports FTP (File Transfer Protocol)-->true
```
</isSupportFtp>
<isSupportUpnp>
```
<!--ro, opt, bool, whether the device supports UPnP (Universal Plug and Play ) protocol-->true
```
</isSupportUpnp>
<isSupportDdns>
```
<!--ro, opt, bool, whether the device supports DDNS (Dynamic Domain Name System) service-->true
```
</isSupportDdns>
<isSupportHttps>
```
<!--ro, opt, bool, whether the device supports HTTPS (Hypertext Transfer Protocol Secure)-->true
```
</isSupportHttps>
<SnmpCap>
```
<!--ro, opt, object, SNMP (Simple Network Management Protocol) capability-->
```
<isSupport>
<!--ro, req, bool, whether the device supports SNMP-->true
</isSupport>
</SnmpCap>
<isSupportExtNetCfg>
<!--ro, opt, bool, whether the device supports configuring extended network parameters-->true
</isSupportExtNetCfg>
<isSupportSSH>
<!--ro, opt, bool, whether the device supports SSH-->true
</isSupportSSH>
<isSupportEZVIZ>
<!--ro, opt, bool, whether the device supports EZ protocol-->true
</isSupportEZVIZ>
<isSupportEhome>
<!--ro, opt, bool, whether the device supports ISUP server configuration-->true
</isSupportEhome>
<isSupportWirelessDial>
<!--ro, opt, bool, whether the device supports wireless dial-up protocol-->true
</isSupportWirelessDial>
<isSupportWirelessServer>
<!--ro, opt, bool, whether the device supports wireless server-->true
</isSupportWirelessServer>
<VerificationCodeModification>
<!--ro, opt, object, device verification code configuration-->
<verificationCodeType opt="normal,empty">
```
<!--ro, opt, string, verification code type, attr:opt{opt, string}-->empty
```
</verificationCodeType>
<verificationCodeModify opt="true,false">
```
<!--ro, opt, bool, whether the device verification code has been modified, attr:opt{opt, string}-->true
```
</verificationCodeModify>
</VerificationCodeModification>
<isSupportEZVIZUnbind>
<!--ro, opt, bool, whether the device supports unbinding from EZ, desc:/ISAPI/System/Network/EZVIZ/unbind?format=json-->true
</isSupportEZVIZUnbind>
</NetworkCap>
<SerialCap>
<!--ro, opt, object, range of RS-485 serial port numbers supported by the device-->
<rs485PortNums>
<!--ro, opt, int, the maximum number of RS-485 serial ports supported by the device-->true
</rs485PortNums>
</SerialCap>
<VideoCap>
<!--ro, opt, object, video encoding capability, desc:related URI: /ISAPI/System/Video/capabilities-->
<videoInputPortNums>
<!--ro, opt, int, number of video input ports-->true
</videoInputPortNums>
<videoOutputPortNums>
<!--ro, opt, int, number of video output ports-->true
</videoOutputPortNums>
<isSupportHeatmap>
<!--ro, opt, bool, whether the device supports heat map-->true
</isSupportHeatmap>
<isSupportCounting>
<!--ro, opt, bool, whether the device supports people counting-->true
</isSupportCounting>
<isSupportPreviewSwitch>
<!--ro, opt, bool, whether the device supports switching live view-->true
</isSupportPreviewSwitch>
<isSupportRecodStatus>
<!--ro, opt, bool, whether the device supports searching for the recording status-->true
</isSupportRecodStatus>
<isSupportPrivacyMask>
<!--ro, opt, bool, whether the device supports privacy mask-->true
</isSupportPrivacyMask>
<isSupportBinocularPreviewSwitch>
<!--ro, opt, bool, whether the device supports switching live view of the dual-lens camera-->true
</isSupportBinocularPreviewSwitch>
<isSupportCalibCheck>
<!--ro, opt, bool, whether the device supports calibration verification-->true
</isSupportCalibCheck>
<isSupportPIP>
<!--ro, opt, bool, whether the device supports PIP-->true
</isSupportPIP>
</VideoCap>
<AudioCap>
<!--ro, opt, object, audio encoding capability, desc:related URL: /ISAPI/System/Audio/capabilities-->
<audioInputNums>
<!--ro, req, int, number of audio inputs-->1
</audioInputNums>
<audioOutputNums>
Hikvision co MMC
adil@hikvision.co.az
<audioOutputNums>
<!--ro, req, int, number of audio outputs-->1
</audioOutputNums>
<mixAudioInSet>
<!--ro, opt, bool, N/A-->true
</mixAudioInSet>
<mixAudioOutSet>
<!--ro, opt, bool, N/A-->true
</mixAudioOutSet>
<isSupportAudioMixing>
<!--ro, opt, bool, whether the device supports audio mixing-->true
</isSupportAudioMixing>
<isSupportAudioInConfig>
<!--ro, opt, bool, whether the device supports configuring parameters of all audio inputs, desc:related URI:
/ISAPI/System/Audio/AudioIn/capabilities-->true
</isSupportAudioInConfig>
<isSupportAudioOutConfig>
<!--ro, opt, bool, whether the device supports configuring parameters of all audio outputs, desc:related URI:
/ISAPI/System/Audio/AudioOut/capabilities?format=json-->true
</isSupportAudioOutConfig>
</AudioCap>
<isSupportSubscribeEvent>
<!--ro, opt, bool, whether the device supports subscribing to events, desc:related URI: /ISAPI/Event/notification/subscribeEventCap-->true
</isSupportSubscribeEvent>
<isSupportTimeCap>
<!--ro, opt, bool, whether the device supports the time configuration, desc:related URI: /ISAPI/System/time/capabilities-->true
</isSupportTimeCap>
<isSupportPostUpdateFirmware>
<!--ro, opt, bool, whether the device supports upgrading firmware by POST method-->true
</isSupportPostUpdateFirmware>
</SysCap>
<voicetalkNums>
<!--ro, opt, int, number of two-way audio channels-->2
</voicetalkNums>
<isSupportSnapshot>
<!--ro, opt, bool, whether the device supports capturing pictures-->true
</isSupportSnapshot>
<SecurityCap>
<!--ro, opt, object, encryption capability set-->
<supportUserNums>
<!--ro, opt, int, supported maximum number of users-->1
</supportUserNums>
<userBondIpNums>
<!--ro, opt, int, supported maximum number of IP addresses that can be bound-->1
</userBondIpNums>
<userBondMacNums>
<!--ro, opt, int, supported maximum number of MAC addresses that can be bound-->1
</userBondMacNums>
<isSupCertificate>
<!--ro, opt, bool, whether the device supports authentication-->true
</isSupCertificate>
<issupIllegalLoginLock>
<!--ro, opt, bool, whether the device supports locking login-->true
</issupIllegalLoginLock>
<isSupportOnlineUser>
<!--ro, opt, bool, whether the device supports the online user configuration-->true
</isSupportOnlineUser>
<isSupportAnonymous>
<!--ro, opt, bool, whether the device supports anonymous login-->true
</isSupportAnonymous>
<isSupportStreamEncryption>
<!--ro, opt, bool, whether the device supports stream encryption-->true
</isSupportStreamEncryption>
<securityVersion opt="1,2,3,4,7">
```
<!--ro, opt, string, encryption capability, attr:opt{opt, string}, desc:the encryption capability of each version consists of two parts: encryption
```
algorithm and the range of encrypted nodes. Currently 1 refers to AES128 encryption and 2 refers to AES256 encryption. The range of encrypted nodes is
described in each protocol-->test
</securityVersion>
<keyIterateNum>
<!--ro, opt, int, iteration times, desc:the value is usually between 100 and 1000-->100
</keyIterateNum>
<isSupportUserCheck>
```
<!--ro, opt, bool, whether the device supports verifying the login password when editing (editing/adding/deleting) user parameters, desc:this node
```
depends on the node <securityVersion>, which means that it is only valid for the versions that support encrypting the sensitive information-->true
</isSupportUserCheck>
<isSupportGUIDFileDataExport>
<!--ro, opt, bool, whether the device supports exporting the device's GUID file-->true
</isSupportGUIDFileDataExport>
<isSupportSecurityQuestionConfig>
<!--ro, opt, bool, whether the device supports answering security questions-->true
</isSupportSecurityQuestionConfig>
<isSupportGetOnlineUserListSC>
<!--ro, opt, bool, whether the device supports searching the online user list-->true
</isSupportGetOnlineUserListSC>
<SecurityLimits>
<!--ro, opt, object, capability of configuring security limit parameters-->
<LoginPasswordLenLimit min="1" max="16">
```
<!--ro, opt, string, length limit of the user's login password, attr:min{opt, string},max{opt, string}-->test
```
</LoginPasswordLenLimit>
<SecurityAnswerLenLimit min="1" max="128">
```
<!--ro, opt, string, length limit of the security question's answer, attr:min{opt, string},max{opt, string}-->test
```
</SecurityAnswerLenLimit>
</SecurityLimits>
<RSAKeyLength opt="512,1024,2048,3072" def="3072">
Hikvision co MMC
adil@hikvision.co.az
<RSAKeyLength opt="512,1024,2048,3072" def="3072">
```
<!--ro, opt, enum, HTTPS certificate length, subType:string, attr:opt{opt, string},def{opt, string}, desc:512, 1024, 2048-->3072
```
</RSAKeyLength>
<isSupportONVIFUserManagement>
<!--ro, opt, bool, whether the device supports ONVIF user management-->true
</isSupportONVIFUserManagement>
<WebCertificateCap>
<!--ro, opt, object, HTTP authentication capability-->
<CertificateType opt="basic,digest,digest/basic">
```
<!--ro, req, string, certificate type: basic (authentication), attr:opt{opt, string}-->test
```
</CertificateType>
</WebCertificateCap>
<isSupportConfigFileImport>
<!--ro, opt, bool, whether the device supports importing the configuration file-->true
</isSupportConfigFileImport>
<isSupportConfigFileExport>
<!--ro, opt, bool, whether the device supports exporting the configuration file-->true
</isSupportConfigFileExport>
<cfgFileSecretKeyLenLimit min="0" max="16">
```
<!--ro, opt, string, length limit of the configuration file's verification key, attr:min{opt, string},max{opt, string}-->0
```
</cfgFileSecretKeyLenLimit>
<salt>
<!--ro, opt, string, the specific salt used by the user to log in-->test
</salt>
<isSupportDeviceCertificatesManagement>
<!--ro, opt, bool, whether the device supports certificate management-->true
</isSupportDeviceCertificatesManagement>
<isSupportSecurityEmail>
<!--ro, opt, bool, whether the device supports configuring the security email-->true
</isSupportSecurityEmail>
<isSupportEncryptCertificate>
<!--ro, opt, bool, whether the device supports certificate encryption, desc:/ISAPI/Security/deviceCertificate-->true
</isSupportEncryptCertificate>
<isSupportCertificateCustomID>
<!--ro, opt, bool, whether the device supports using the user's custom ID to configure the certificate-->true
</isSupportCertificateCustomID>
</SecurityCap>
<EventCap>
<!--ro, opt, object, event capability-->
</EventCap>
<RacmCap>
<!--ro, opt, object, UI before picture search-->
<SecurityLog>
<!--ro, opt, object, device's capability of security log-->
<isSupportLogServer>
<!--ro, opt, bool, whether it supports security log server configuration-->true
</isSupportLogServer>
<SecurityLogTypeList>
<!--ro, req, array, list of security log types, subType:object-->
<SecurityLogType>
<!--ro, opt, object, security log type-->
<primaryType>
<!--ro, req, string, main log type, desc:"Event", "Operation", "Other", "All"-->test
</primaryType>
<secondaryType opt="all">
```
<!--ro, req, string, minor log type, attr:opt{opt, string}, desc:for other types, refer to the appendix-->test
```
</secondaryType>
</SecurityLogType>
</SecurityLogTypeList>
</SecurityLog>
</RacmCap>
<isSupportEhome>
<!--ro, opt, bool, whether the device supports ISUP functions-->true
</isSupportEhome>
<VideoIntercomCap>
<!--ro, opt, object, video intercom capability, desc:related URI: /ISAPI/VideoIntercom/capabilities-->
</VideoIntercomCap>
<isSupportAcsUpdate>
```
<!--ro, opt, bool, whether the device supports peripheral module upgrade (true, support), desc:related URI: /ISAPI/System/AcsUpdate/capabilities-->true
```
</isSupportAcsUpdate>
<isSupportEncryption>
<!--ro, opt, bool, stream encryption capability-->true
</isSupportEncryption>
<supportImageChannel opt="1,2,3,4">
```
<!--ro, opt, string, whether the device supports configuring the image channel, attr:opt{req, string},
```
```
desc:the configuration of actual image channel supported by the device (URI for picture parameters: /ISAPI/Image/channels/<channelID>), if this node is not
```
```
returned, the image channel is the same with the encoding channel (/ISAPI/Streaming/channels) by default
```
this node is mainly for the situation when the image channel is inconsistent with the actual stream channel. For example, some device, which altogether
```
has four sensors and they are all spliced into one encoding channel for output. Every sensor supports configuring image parameters; by default, the image
```
channel 1 is only valid for the images of sensor1-->test
</supportImageChannel>
<isSupportImageCap>
<!--ro, opt, bool, whether the device supports configuring image parameters-->true
</isSupportImageCap>
<isSupportPictureServer>
<!--ro, opt, bool, whether the device supports configuring the picture storage server, desc:related URI: /ISAPI/System/PictureServer/capabilities?
```
format=json-->true
```
</isSupportPictureServer>
<isSupportAlgorithmsInfo>
<!--ro, opt, bool, whether the device supports getting the algorithm version of the device-->true
</isSupportAlgorithmsInfo>
<isSupportFaceTemperatureMeasurementEvent>
<!--ro, opt, bool, whether the device supports the skin-surface temperature measurement event, desc:eventType: FaceTemperatureMeasurementEvent-->true
</isSupportFaceTemperatureMeasurementEvent>
Hikvision co MMC
adil@hikvision.co.az
<isSupportQRCodeEvent>
<!--ro, opt, bool, whether the device supports the QR code event, desc:eventType: QRCodeEvent-->true
</isSupportQRCodeEvent>
<isSupportAccessControlCap>
<!--ro, opt, bool, access control capability, desc:related URI: /ISAPI/AccessControl/capabilities-->true
</isSupportAccessControlCap>
<isSupportClientProxyWEB>
<!--ro, opt, bool, whether to support WEB page jumping, desc:whether to support WEB page jumping-->true
</isSupportClientProxyWEB>
<WEBLocation>
```
<!--ro, opt, string, WEB page placement location, range:[1,32], desc:local-local server, remote-remote server; (if this node is not returned, the WEB
```
```
page will be placed in the local server by default)-->local
```
</WEBLocation>
<isSupportUserManualQRCode>
<!--ro, opt, bool, whether the device supports getting the QR code of the user manual, desc:related URI: /ISAPI/System/userManualQRCode/capabilities?
```
format=json-->true
```
</isSupportUserManualQRCode>
<isSupportHealthInfoSyncQuery>
<!--ro, opt, bool, whether the device supports the event of searching for health information, desc:eventType: HealthInfoSyncQuery-->true
</isSupportHealthInfoSyncQuery>
<isSupportEZVIZParameterTest>
<!--ro, opt, bool, whether the device supports testing EZ parameters, desc:related URI: /ISAPI/System/Network/EZVIZ/parameterTest?format=json-->true
</isSupportEZVIZParameterTest>
<isSupportManualSnapPicture>
<!--ro, opt, bool, whether the device supports manual picture capturing, desc:related URI:
/ISAPI/Streaming/channels/<trackStreamID>/picture/capabilities?format=json-->true
</isSupportManualSnapPicture>
<isSupportVideoCodeConvertTool>
<!--ro, opt, bool, whether the device supports getting the video encoding conversion tool, desc:related URI: /ISAPI/System/videoCodeConvertTool?
```
format=json protocol-->true
```
</isSupportVideoCodeConvertTool>
</DeviceCap>
Request URL
GET /ISAPI/System/DeviceLanguage
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<DeviceLanguage xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, languages supported by the device, attr:version{req, string, protocolVersion}-->
```
<language>
```
<!--ro, req, enum, language, subType:string, desc:"SimChinese" (simplified Chinese), "TraChinese" (traditional Chinese), "English", "Russian",
```
"Bulgarian", "Hungarian", "Greek", "German", "Italian", "Czech", "Slovakia", "French", "Polish", "Dutch", "Portuguese", "Spanish", "Romanian", "Turkish",
"Japanese", "Danish", "Swedish", "Norwegian", "Finnish", "Korean", "Thai", "Estonia", "Vietnamese", "Hebrew", "Latvian", "Arabic", "Sovenian"-Slovenian,
"Croatian", "Lithuanian", "Serbian", "BrazilianPortuguese"-Brazilian Portuguese, "Indonesian", "Ukrainian", "EURSpanish", "Sovenian", "Uzbek", "Kazak",
"Kirghiz", "Farsi", "Azerbaidzhan", "Burmese", "Mongolian"-->SimChinese
</language>
</DeviceLanguage>
Request URL
PUT /ISAPI/System/DeviceLanguage
Query Parameter
None
Request Message
12.1.4.4 Get the languages supported by the device
12.1.4.5 Set device language parameters
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<DeviceLanguage xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--req, object, languages supported by the device, attr:version{req, string, protocolVersion}-->
```
<language>
```
<!--req, enum, language, subType:string, desc:"SimChinese" (simplified Chinese), "TraChinese" (traditional Chinese), "English", "Russian", "Bulgarian",
```
"Hungarian", "Greek", "German", "Italian", "Czech", "Slovakia", "French", "Polish", "Dutch", "Portuguese", "Spanish", "Romanian", "Turkish", "Japanese",
```
"Danish", "Swedish", "Norwegian", "Finnish", "Korean", "Thai", "Estonia", "Vietnamese", "Hebrew", "Latvian", "Arabic", "Sovenian" (Slovenian), "Croatian",
```
```
"Lithuanian", "Serbian", "BrazilianPortuguese" (Brazilian Portuguese), "Indonesian", "Ukrainian", "EURSpanish"-->SimChinese
```
</language>
</DeviceLanguage>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, which describes the error in details, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/System/DeviceLanguage/capabilities
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<DeviceLanguage xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, device language configuration, attr:version{req, string, protocolVersion}-->
```
<language
```
opt="SimChinese,TraChinese,English,Russian,Bulgarian,Hungarian,Greek,German,Italian,Czech,Slovakia,French,Polish,Dutch,Portuguese,Spanish,Romanian,Turkish,J
```
apanese,Danish,Swedish,Norwegian,Finnish,Korean,Thai,Estonia,Vietnamese,Hebrew,Latvian,Arabic,Sovenian,Croatian,Lithuanian,Serbian,BrazilianPortuguese,Indon
esian,Ukrainian,EURSpanish,Uzbek,Kazak,Kirghiz,Farsi,Azerbaidzhan,Burmese,Mongolian,Anglicism,Estonian">
```
<!--ro, req, enum, language, subType:string, attr:opt{req, string}, desc:"SimChinese" (simplified Chinese), "TraChinese" (traditional Chinese),
```
"English", "Russian", "Bulgarian", "Hungarian", "Greek", "German", "Italian", "Czech", "Slovakia", "French", "Polish", "Dutch", "Portuguese", "Spanish",
"Romanian", "Turkish", "Japanese", "Danish", "Swedish", "Norwegian", "Finnish", "Korean", "Thai", "Estonia", "Vietnamese", "Hebrew", "Latvian", "Arabic",
"Sovenian"-Slovenian, "Croatian", "Lithuanian", "Serbian", "BrazilianPortuguese"-Brazilian Portuguese, "Indonesian", "Ukrainian", "EURSpanish", "Sovenian",
"Uzbek", "Kazak", "Kirghiz", "Farsi", "Azerbaidzhan", "Burmese", "Mongolian"-->SimChinese
</language>
<upgradeFirmWareEnabled>
<!--ro, opt, bool, whether to enable upgrading the firmware-->true
</upgradeFirmWareEnabled>
</DeviceLanguage>
Request URL
PUT /ISAPI/System/factoryReset?mode=<mode>&childDevID=<devIndex>&loginPassword=
<loginPassword>&module=<module>
Query Parameter
12.1.4.6 Get the capability of configuring the device language
12.1.4.7 Set restoring devices' default parameters
Hikvision co MMC
adil@hikvision.co.az
Parameter Name Parameter Type Description
mode enum --
devIndex string --
loginPassword string --
module enum --
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status description, subType:string, desc:“OK” (succeeded), “Device Busy”, “Device Error”, “Invalid Operation”, “Invalid XML Format”,
```
```
“Invalid XML Content”, “Reboot” (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/System/Network/capabilities
Query Parameter
None
Request Message
None
Response Message
12.1.4.8 Get the network service capability
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<NetworkCap xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, get the network service capability, attr:version{opt, string, protocolVersion}-->
```
<isSupportWireless>
<!--ro, req, bool, whether the device supports wireless network-->true
</isSupportWireless>
<isSupportWired>
<!--ro, opt, bool, whether the device supports wired network-->true
</isSupportWired>
<isSupportPPPoE>
```
<!--ro, req, bool, whether the device supports PPPoE (Point to Point Protocol over Ethernet)-->true
```
</isSupportPPPoE>
<isSupportBond>
```
<!--ro, req, bool, whether the device supports NIC (Network Interface Card) bonding-->true
```
</isSupportBond>
<isSupport802_1x>
<!--ro, req, bool, whether the device supports 802.1x protocol-->true
</isSupport802_1x>
<isSupportNtp>
```
<!--ro, opt, bool, whether the device supports NTP (Network Time Protocol)-->true
```
</isSupportNtp>
<isSupportFtp>
```
<!--ro, opt, bool, whether the device supports FTP (File Transfer Protocol)-->true
```
</isSupportFtp>
<isSupportUpnp>
```
<!--ro, opt, bool, whether the device supports UPnP (Universal Plug and Play) protocol-->true
```
</isSupportUpnp>
<isSupportDdns>
```
<!--ro, opt, bool, whether the device supports DDNS (Dynamic Domain Name System) service-->true
```
</isSupportDdns>
<isSupportHttps>
```
<!--ro, opt, bool, whether the device supports HTTPS (Hypertext Transfer Protocol Secure)-->true
```
</isSupportHttps>
<SnmpCap>
```
<!--ro, opt, object, SNMP (Simple Network Management Protocol) capability-->
```
<isSupport>
<!--ro, req, bool, whether the device supports SNMP-->true
</isSupport>
</SnmpCap>
<isSupportExtNetCfg>
<!--ro, opt, bool, whether the device supports configuring extended network parameters-->true
</isSupportExtNetCfg>
<isSupportSSH>
<!--ro, opt, bool, whether the device supports SSH-->true
</isSupportSSH>
<isSupportEZVIZ>
<!--ro, opt, bool, whether the device supports EZ protocol-->true
</isSupportEZVIZ>
<isSupportEhome>
```
<!--ro, opt, bool, whether the device supports EHome (ISUP) protocol-->true
```
</isSupportEhome>
<isSupportWirelessDial>
<!--ro, opt, bool, whether the device supports wireless dial-up protocol-->true
</isSupportWirelessDial>
<isSupportWirelessServer>
<!--ro, opt, bool, whether the device supports wireless server-->true
</isSupportWirelessServer>
<VerificationCodeModification>
<!--ro, opt, object, verification code editing-->
<verificationCodeType opt="normal,empty">
```
<!--ro, opt, string, verification code type, attr:opt{req, string}-->test
```
</verificationCodeType>
<verificationCodeModify opt="true,false">
```
<!--ro, opt, bool, whether the device verification code has been modified, attr:opt{req, string}-->true
```
</verificationCodeModify>
</VerificationCodeModification>
<isSupportEZVIZUnbind>
<!--ro, opt, bool, whether the device supports unbinding from EZ, desc:/ISAPI/System/Network/EZVIZ/unbind?format=json-->true
</isSupportEZVIZUnbind>
</NetworkCap>
Request URL
PUT /ISAPI/System/Network/ssh?readerID=<readerID>&type=<type>&SOCChipID=<SOCChipID>
Query Parameter
12.1.4.9 Set SSH parameters
Hikvision co MMC
adil@hikvision.co.az
Parameter Name Parameter Type Description
readerID string --
type enum --
SOCChipID string --
Request Message
<?xml version="1.0" encoding="UTF-8"?>
<SSH xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--wo, opt, object, attr:version{opt, string, protocolVersion}-->
```
<enabled>
<!--wo, req, bool, whether to enable the function-->true
</enabled>
<port>
<!--wo, opt, int-->22
</port>
</SSH>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
<!--ro, req, enum, read-only,status description: OK,Device Busy,Device Error,Invalid Operation,Invalid XML Format,Invalid XML Content,Reboot,Additional
```
Error, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format", "Invalid XML Content", "Reboot"
```
```
(reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, which describes the error in details, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
</ResponseStatus>
Request URL
PUT /ISAPI/System/reboot?childDevID=<devIndex>&module=<module>&loginPassword=<loginPassword>
Query Parameter
Parameter
Name
Parameter
Type Description
devIndex string
Reboot a sub-device via specifying sub-device ID. The ID of the sub-device connected to
the current device can be searched via /ISAPI/IoTGateway/Childmanage/SearchChild?
```
format=json.
```
module enum
The "module" specifies a module to restart, without requiring a device reboot,
```
corresponding to the capability (/ISAPI/System/capabilities/deviceReboot->module).
```
```
"algorithmProgram (traffic terminal radar-assisted algorithm program, supports
```
```
independent algorithm program startup), "radar" (restart radar module of the radar-
```
```
assisted camera).
```
loginPassword string --
Request Message
None
Response Message
12.1.4.10 Reboot device
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, opt, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status description, subType:string, desc:“OK” (succeeded), “Device Busy”, “Device Error”, “Invalid Operation”, “Invalid XML Format”,
```
```
“Invalid XML Content”, “Reboot” (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code-->OK
</subStatusCode>
<description>
<!--ro, opt, string, custom error message description, range:[0,1024], desc:the custom error message description returned by the application is used to
quickly identify and evaluate issues-->badXmlFormat
</description>
<MErrCode>
<!--ro, opt, string, error codes categorized by functional modules, desc:all general error codes are in the range of this field-->0x00000000
</MErrCode>
<MErrDevSelfEx>
<!--ro, opt, string, error codes categorized by functional modules, desc:N/A-->0x00000000
</MErrDevSelfEx>
</ResponseStatus>
Request URL
GET /ISAPI/System/Video/capabilities
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<VideoCap xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, attr:version{req, string, protocolVersion}-->
```
<videoInputPortNums>
<!--ro, opt, int, number of video input ports-->0
</videoInputPortNums>
<videoOutputPortNums>
<!--ro, opt, int, number of video output ports-->0
</videoOutputPortNums>
<menuNums>
<!--ro, opt, int, number of local menus that can be displayed-->0
</menuNums>
<externalChannelNum>
<!--ro, opt, bool, number of extended analog channels-->true
</externalChannelNum>
<isSupportHeatmap>
<!--ro, opt, bool, whether the device supports heat map-->true
</isSupportHeatmap>
<isSupportCounting>
<!--ro, opt, bool, whether the device supports people counting-->true
</isSupportCounting>
<countingType>
<!--ro, opt, enum, statistics type, subType:string, desc:statistics type-->human
</countingType>
<isSupportPicture>
<!--ro, opt, bool, whether the device supports OSD picture overlay, desc:related URI: /ISAPI/System/Video/inputs/channels/<channelID>/image/picture--
>true
</isSupportPicture>
<isSupportPreviewSwitch>
<!--ro, opt, bool, whether the device supports switching live view-->true
</isSupportPreviewSwitch>
<isSupportRecodStatus>
<!--ro, opt, bool, whether the device supports searching for the recording status-->true
</isSupportRecodStatus>
<isSupportPrivacyMask>
<!--ro, opt, bool, whether the device supports privacy mask-->true
</isSupportPrivacyMask>
<isSupportBinocularPreviewSwitch>
<!--ro, opt, bool, whether the device supports switching live view of the dual-lens camera-->true
</isSupportBinocularPreviewSwitch>
<isSupportCalibCheck>
12.1.4.11 Get the video analysis task capability
Hikvision co MMC
adil@hikvision.co.az
<isSupportCalibCheck>
<!--ro, opt, bool, whether the device supports calibration verification-->true
</isSupportCalibCheck>
<isSupportPIP>
<!--ro, opt, bool-->true
</isSupportPIP>
<isSupportFocusVideoMode>
<!--ro, opt, bool-->true
</isSupportFocusVideoMode>
<isSupportExternalChannel>
<!--ro, opt, bool, whether the device supports extended analog channels-->true
</isSupportExternalChannel>
<isSupportMultiChannelCounting>
<!--ro, opt, bool-->true
</isSupportMultiChannelCounting>
<isSupportCountingCollection>
<!--ro, opt, bool, whether the device supports people counting ANR-->true
</isSupportCountingCollection>
<isSupportHeatmapCollection>
<!--ro, opt, bool, whether the device supports heat map data ANR-->true
</isSupportHeatmapCollection>
<channelFlexible opt="name,enable,online,linknum">
```
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->name
```
</channelFlexible>
<isSupportOutputsResource>
<!--ro, opt, bool, related URI: /ISAPI/System/Video/outputs/resource?format=json, desc:related URI: /ISAPI/System/Video/outputs/resource?format=json--
>true
</isSupportOutputsResource>
<OSDLanguage opt="GBK,EUC-KR,Hebrew" def="GBK">
```
<!--ro, opt, enum, subType:string, attr:opt{req, string},def{req, string}-->GBK
```
</OSDLanguage>
<isSupportMixedChannel>
<!--ro, opt, bool-->true
</isSupportMixedChannel>
<isSupportMixedChannelStatus>
<!--ro, opt, bool-->true
</isSupportMixedChannelStatus>
<isSupportOutputCourseware>
<!--ro, opt, bool, related URI: /ISAPI/System/Video/outputs/courseware/capabilities?format=json, desc:related URI:
/ISAPI/System/Video/outputs/courseware/capabilities?format=json-->true
</isSupportOutputCourseware>
<isSupportVideoInputMode>
<!--ro, opt, bool, related URI: /ISAPI/System/Video/inputs/mode/capabilities, desc:related URI: /ISAPI/System/Video/inputs/mode/capabilities-->true
</isSupportVideoInputMode>
<isSupportVideoOutputMode>
<!--ro, opt, bool, related URI: /ISAPI/System/Video/outputs/mode/capabilities?format=json, desc:related URI:
/ISAPI/System/Video/outputs/mode/capabilities?format=json-->true
</isSupportVideoOutputMode>
<PreviewMode>
<!--ro, opt, object-->
<PIPType>
<!--ro, opt, object-->
<mainScreenChannelID>
<!--ro, opt, int-->0
</mainScreenChannelID>
<subScreenChannelID>
<!--ro, opt, int-->0
</subScreenChannelID>
</PIPType>
</PreviewMode>
<isSupportViewTag>
<!--ro, opt, bool-->true
</isSupportViewTag>
<isSupportMenuStatus>
<!--ro, opt, bool-->true
</isSupportMenuStatus>
</VideoCap>
Request URL
GET /ISAPI/System/AcsUpdate/capabilities
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
12.1.5 Upgrade Management
12.1.5.1 Get the capabilities of peripheral module upgrade
Hikvision co MMC
adil@hikvision.co.az
<AcsUpdate xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, capabilities of peripheral module upgrade, attr:version{req, string, protocolVersion}-->
```
<type
```
opt="cardReader,FPModule,securityModule,extendModule,channelController,IRModule,lampModule,elevatorController,FPAlgorithmProgram,uboot,keypad,wirelessRecv,w
```
iredZone,sirenIndoor,sirenOutdoor,sirenAudio,repeater,bluetoothModule,single,wallSwitch,smartPlug,detector,transmitter,remoteCtrl,subModule,dispModule,netRe
ader,lockControlBoard,networkZoneModule,userInterfaceBoard,subPermissionController,electricLock,heatingModule,RS485Module,QRCodeModule,R3WirelessRecv,RXWire
lessRecv,wiredOutput,electricGenie,zigbeeModule,PMRModule,networkInputAndOutputModule,infoModule,keypadAndCardReader,socialSecurityCardModule,localControlle
r">
```
<!--ro, opt, enum, upgrade type: upgrade peripheral, subType:string, attr:opt{req, string}, desc:"cardReader" (485 card reader), "FPModule" (fingerprint
```
```
module), "securityModule" (security module), "extendModule" (I/O extended module), "channelController" (lane controller), "IRModule" (infrared module),
```
```
"lampModule" (indicator module), "elevatorController" (sub elevator controller), "FPAlgorithmProgram" (fingerprint algorithm programma of card reader),
```
```
"uboot" (uboot upgrade), "keypad" (keypad), "wirelessRecv" (wireless receiver module), "wiredZone" (wired zone module), "sirenIndoor" (indoor sounder),
```
```
"sirenOutdoor" (outdoor sounder), "sirenAudio" (sounder two-way audio), "repeater" (repeater), "bluetoothModule" (bluetooth module), "single" (single output
```
```
module), "wallSwitch" (wall mounted switch), "smartPlug" (smart plug), "detector" (detector), "transmitter" (transmitter peripheral), "remoteCtrl" (keyfob),
```
```
"subModule" (sub module), "dispModule" (display module), "netReader" (network card reader), "faceModule" (face module), "touchScreenModule" (touch screen
```
```
module), "temperatureModule" (temperature measurement module), "lockControlBoard" (lock control board), "networkZoneModule" (network zone module),
```
```
"userInterfaceBoard" (interface board), "subPermissionController" (sub permission controller), "electricLock" (electric lock), "heatingModule" (heating
```
```
module), "RS485Module" (RS-485 module), "QRCodeModule" (QR code module), "electricGenie" (electric Genie), "zigbeeModule" (zigbee module), "PMRModule" (PMR
```
```
module), "networkInputAndOutputModule" (network input and output module via network TAP)-->cardReader
```
</type>
<batchType opt="electricGenie,wiredOutput,networkZoneModule,networkInputAndOutputModule">
```
<!--ro, opt, enum, batch upgrade type (peripheral type), subType:string, attr:opt{req, string},
```
```
desc:peripheral types which support batch upgrading;
```
```
if this node is supported, the following operations are supported: 1. Upgrade devices: /ISAPI/System/updateFirmware?type=<type>; 2. Start upgrading the
```
```
specified analysis unit (device of the cluster): /ISAPI/System/upgradeStatus/startUpgrade?format=json; 3. Get the device upgrade progress:
```
/ISAPI/System/upgradeStatus?format=json-->electricGenie
</batchType>
<cardReaderNo min="1" max="10" opt="1,4">
```
<!--ro, opt, int, card reader No. range, it is valid when the returned value of type consists cardReader, attr:min{opt, int, step:1},max{opt, int,
```
```
step:1},opt{opt, string}-->1
```
</cardReaderNo>
<FPModuleNo min="1" max="10">
```
<!--ro, opt, int, fingerprint module No. range, it is valid when the returned value of type consists FPModule, attr:min{req, int},max{req, int}-->1
```
</FPModuleNo>
<securityModuleNo min="1" max="10">
```
<!--ro, opt, int, security module No. range, it is valid when the returned value of type consists securityModule, attr:min{req, int},max{req, int}-->1
```
</securityModuleNo>
<extendModuleNo min="1" max="10">
```
<!--ro, opt, int, No. range of I/O extended module, it is valid when the returned value of type consists extendModule, attr:min{req, int},max{req, int}-
```
->1
</extendModuleNo>
<channelControllerNo min="1" max="10">
```
<!--ro, opt, int, lane controller No. range, it is valid when the returned value of type consists channelController, attr:min{req, int},max{req, int}--
```
>1
</channelControllerNo>
<IRModuleNo min="1" max="10">
```
<!--ro, opt, int, infrared module No. range, it is valid when the returned value of type consists IRModule, attr:min{req, int},max{req, int}-->1
```
</IRModuleNo>
<lampModuleNo min="1" max="10">
```
<!--ro, opt, int, indicator module No. range, it is valid when the returned value of type consists lampModule, attr:min{req, int},max{req, int}-->1
```
</lampModuleNo>
<elevatorControllerNo min="1" max="10">
```
<!--ro, opt, int, sub elevator controller No. range, it is valid when the returned value of type consists elevatorController, attr:min{req,
```
```
int},max{req, int}-->1
```
</elevatorControllerNo>
<FPAlgorithmProgramNo min="1" max="10">
<!--ro, opt, int, No. range of fingerprint algorithm programma of card reader, it is valid when the returned value of type consists FPAlgorithmProgram,
```
attr:min{req, int},max{req, int}-->1
```
</FPAlgorithmProgramNo>
<faceModuleNo min="1" max="10">
```
<!--ro, opt, int, face module No. range, it is valid when the returned value of type consists faceModule, attr:min{req, int},max{req, int}-->1
```
</faceModuleNo>
<touchScreenModuleNo min="1" max="10">
```
<!--ro, opt, int, touch screen module No. range, it is valid when the returned value of type consists touchScreenModule, attr:min{req, int},max{req,
```
```
int}-->1
```
</touchScreenModuleNo>
<temperatureModuleNo min="1" max="10">
```
<!--ro, opt, int, No. range of temperature measurement module, it is valid when the returned value of type consists temperatureModule, attr:min{req,
```
```
int},max{req, int}-->1
```
</temperatureModuleNo>
<keypadAddress opt="1,3,5">
```
<!--ro, opt, int, keypad address range, it is valid when the returned value of type consists keypad, attr:opt{req, string}-->1
```
</keypadAddress>
<wirelessRecvAddress opt="1,3,5">
```
<!--ro, opt, int, No. range of wireless receiver module, it is valid when the returned value of type consists wirelessRecv, attr:opt{req, string}-->1
```
</wirelessRecvAddress>
<wiredZoneAddress opt="1,3,5">
```
<!--ro, opt, int, No. range of wired zone module, it is valid when the returned value of type consists wiredZone, attr:opt{req, string}-->1
```
</wiredZoneAddress>
<sirenIndoorNo opt="1,3,5">
```
<!--ro, opt, int, indoor sounder No. range, it is valid when the returned value of type consists sirenIndoor, attr:opt{req, string}-->1
```
</sirenIndoorNo>
<sirenOutdoorNo opt="1,3,5">
```
<!--ro, opt, int, outdoor sounder No. range, it is valid when the returned value of type consists sirenOutdoor, attr:opt{req, string}-->1
```
</sirenOutdoorNo>
<repeaterNo opt="1,3,5">
```
<!--ro, opt, int, repeater No. range, it is valid when the returned value of type consists repeater, attr:opt{req, string}-->1
```
</repeaterNo>
<subModuleNo opt="1,3,5">
```
<!--ro, opt, int, sub module No. range, it is valid when the returned value of type consists subModule, attr:opt{req, string}-->1
```
</subModuleNo>
<dispModuleNo opt="1,3,5">
```
<!--ro, opt, int, display module No. range, it is valid when the returned value of type consists dispModule, attr:opt{req, string}-->1
```
</dispModuleNo>
Hikvision co MMC
adil@hikvision.co.az
</dispModuleNo>
<single opt="1,3,5">
```
<!--ro, opt, int, No. range of single output module, it is valid when the returned value of type consists single, attr:opt{req, string}-->1
```
</single>
<wallSwitch opt="1,3,5">
```
<!--ro, opt, int, No. range of wall mounted switch, it is valid when the returned value of type consists wallSwitch, attr:opt{req, string}-->1
```
</wallSwitch>
<smartPlug opt="1,3,5">
```
<!--ro, opt, int, smart plug No. range, it is valid when the returned value of type consists smartPlug, attr:opt{req, string}-->1
```
</smartPlug>
<zoneNo opt="1,3,5">
```
<!--ro, opt, int, zone No. range, it is valid when the returned value of type consists detector, attr:opt{req, string}, desc:get the detector via the
```
zone No.-->1
</zoneNo>
<transmitterNo opt="1,3,5">
```
<!--ro, opt, int, transmitter No. range, it is valid when the returned value of type consists transmitter, attr:opt{req, string}-->1
```
</transmitterNo>
<remoteCtrlNo opt="1,3,5">
```
<!--ro, opt, int, keyfob No. range, it is valid when the returned value of type consists remoteCtrl, attr:opt{req, string}-->1
```
</remoteCtrlNo>
<netReaderNo min="1" max="10">
```
<!--ro, opt, int, No. range of network card reader, it is valid when the returned value of type consists netReader, attr:min{req, int},max{req, int}-->1
```
</netReaderNo>
<lockControlBoardLNo opt="1,2,3,4,5,6,7,8">
```
<!--ro, opt, int, No. range of the left part of the bracket, it is valid when the value of type returns, attr:opt{req, string}-->1
```
</lockControlBoardLNo>
<lockControlBoardRNo opt="1,2,3,4,5,6,7,8">
```
<!--ro, opt, int, No. range of the right part of the bracket, it is valid when the value of type returns, attr:opt{req, string}-->1
```
</lockControlBoardRNo>
<networkZoneModuleNo opt="1,3,5">
```
<!--ro, opt, int, No. range of network zone module, it is valid when the returned value of type consists networkZoneModule, attr:opt{req, string}-->1
```
</networkZoneModuleNo>
<userInterfaceBoardNo opt="0,1">
```
<!--ro, opt, enum, interface board No. range, it is valid when the returned value of type consists userInterfaceBoard, subType:string, attr:opt{req,
```
```
string}, desc:0-main user extended interface board, 1-sub user extended interface board-->0
```
</userInterfaceBoardNo>
<electricLockNo opt="1,3,5">
```
<!--ro, opt, int, electric lock No. range, it is valid when the returned value of type consists electricLock, attr:opt{req, string}-->1
```
</electricLockNo>
<heatingModuleNo opt="1,3,5">
```
<!--ro, opt, int, heating module No. range, it is valid when the returned value of type consists heatingModule, attr:opt{req, string}, desc:the heating
```
module starts to work to increase the device temperature when the devices runs under low temperature-->1
</heatingModuleNo>
<sirenAudioNo opt="1,3,5">
```
<!--ro, opt, int, sounder (two-way audio) No. range, it is valid when the returned value of type consists sirenAudio, attr:opt{req, string}-->1
```
</sirenAudioNo>
<QRCodeModuleNo min="1" max="10">
```
<!--ro, opt, int, No. range of QR code module, it is valid when the returned value of type consists QRCodeModule, attr:min{req, int},max{req, int}-->1
```
</QRCodeModuleNo>
<R3WirelessRecvNo opt="1,2,3,4">
```
<!--ro, opt, int, No. range of R3 wireless receiver module, it is valid when the returned value of type consists R3WirelessRecv, attr:opt{req, string}--
```
>1
</R3WirelessRecvNo>
<RXWirelessRecvNo opt="1,2,3,4">
```
<!--ro, opt, int, No. range of RX wireless receiver module, it is valid when the returned value of type consists RXWirelessRecv, attr:opt{req, string}--
```
>1
</RXWirelessRecvNo>
<wiredOutputNo opt="1,2,3,4">
```
<!--ro, opt, int, No. range of wired output module , it is valid when the returned value of type consists wiredOutput, attr:opt{req, string}-->1
```
</wiredOutputNo>
<electricGenieNo opt="1,2,3,4">
```
<!--ro, opt, int, No. range of electric Genie, it is valid when the returned value of type or batchType consists electricGenie, attr:opt{req, string}--
```
>1
</electricGenieNo>
<networkInputAndOutputModuleNo opt="1,2,3,4">
<!--ro, opt, int, No. range of network input and output module, it is valid when the returned value of type consists networkInputAndOutputModule,
```
attr:opt{req, string}-->1
```
</networkInputAndOutputModuleNo>
<infoModuleNo opt="1,2,3,4">
```
<!--ro, opt, int, dep:or,{$.AcsUpdate.type,eq,infoModule}, attr:opt{req, string}-->1
```
</infoModuleNo>
<keypadAndCardReaderModuleNo opt="1,2,3,4">
```
<!--ro, opt, int, dep:or,{$.AcsUpdate.type,eq,keypadAndCardReaderModule}, attr:opt{req, string}-->1
```
</keypadAndCardReaderModuleNo>
<threeDimensionalStructuredLightModuleNo opt="1,2,3,4">
```
<!--ro, opt, int, dep:or,{$.AcsUpdate.type,eq,threeDimensionalStructuredLightModule}, attr:opt{req, string}-->1
```
</threeDimensionalStructuredLightModuleNo>
<socialSecurityCardModuleNo opt="1">
```
<!--ro, opt, int, dep:or,{$.AcsUpdate.type,eq,socialSecurityCardModule}, attr:opt{req, string}-->1
```
</socialSecurityCardModuleNo>
<localControllerNo min="1" max="62">
```
<!--ro, opt, int, attr:min{req, int},max{req, int}-->1
```
</localControllerNo>
</AcsUpdate>
Request URL
12.1.5.2 Upgrade devices
Hikvision co MMC
adil@hikvision.co.az
POST /ISAPI/System/updateFirmware?type=<type>&moduleAddress=<moduleAddress>&id=
<indexID>&childDevID=<devIndex>&isUpdateAuxDevice=<isUpdateAuxDevice>
Query Parameter
Parameter Name ParameterType Description
type enum
```
device type 1.alarm device: "keypad" (keypad), "wirelessRecv" (wireless receiver
```
```
module), "wiredZone" (wired zone module), "sirenIndoor" (indoor sounder),
```
```
"sirenOutdoor" (outdoor sounder), "sirenAudio" (sounder two-way audio),
```
```
"repeater" (repeater), "bluetoothModule" (bluetooth module), "single" (single output
```
```
module), "wallSwitch" (wall mounted switch), "smartPlug" (smart plug), "detector"
```
```
(detector), "transmitter" (transmitter peripheral), "remoteCtrl" (keyfob),
```
```
"subModule" (sub module), "dispModule" (display module), "netReader" (network
```
```
card reader), "faceModule" (face module), "touchScreenModule" (touch screen
```
```
module), "temperatureModule" (temperature measurement module),
```
```
"lockControlBoard" (lock control board), "networkZoneModule" (network zone
```
```
module), "userInterfaceBoard" (interface board), "subPermissionController" (sub
```
```
permission controller), "electricLock" (electric lock), "heatingModule" (heating
```
```
module), "RS485Module" (RS-485 module), "QRCodeModule" (QR code module),
```
```
"electricGenie" (electric Genie), "zigbeeModule" (zigbee module), "PMRModule"
```
```
(PMR module), "networkInputAndOutputModule" (network input and output
```
```
module via network TAP) 2. access control device: "cardReader" (485 card reader),
```
```
"FPModule" (fingerprint module), "securityModule" (security module),
```
```
"extendModule" (I/O extended module), "channelController" (lane controller),
```
```
"IRModule" (infrared module), "lampModule" (indicator module),
```
```
"elevatorController" (sub elevator controller), "FPAlgorithmProgram" (fingerprint
```
```
algorithm program of card reader), "bluetoothModule" (bluetooth module), "MCU"-
```
```
MCU upgrade, "temperatureModule" (temperature measurement module),
```
```
"faceModule" (face module), "touchScreenModule" (touch screen module),
```
```
"netReader" (network card reader), "userInterfaceBoard" (interface board),
```
```
"subPermissionController" (sub permission controller), "QRCodeModule" (QR code
```
```
module) 3. intelligent cabinet: "lockControlBoard" (lock control board) 4.
```
```
"ledReceiverCard"-receiving card; 5. "subsystem"-sub system; 6. radar-assisted
```
```
device: "warningScreenFirmware"-firmware upgrade of pre-alarm screen,
```
"warningScreenFont"-font library upgrade of pre-alarm screen,
```
"warningScreenVoice"-audio upgrade of pre-alarm screen; 7. "electricGenie"-
```
electric Genie
moduleAddress string
module address is an exclusive node for Ax Hybrid example: keypad: GET
```
/ISAPI/SecurityCP/Configuration/outputs?format=json; relay: GET
```
```
/ISAPI/SecurityCP/Configuration/outputs?format=json; sounder: GET
```
```
/ISAPI/SecurityCP/Configuration/wirelessSiren?format=json; output module: GET
```
```
/ISAPI/SecurityCP/Configuration/outputModules?format=json; extension module:
```
```
GET /ISAPI/SecurityCP/Configuration/extensionModule?format=json; zone: GET
```
/ISAPI/SecurityCP/Configuration/zones?format=json
```
indexID string device No. 1. AX Hybrid Pro and wireless security control upgrade by ID; 2. accesscontrol devices upgrade by ID; 3. intelligent cabinet upgrade by IS
```
devIndex string --
isUpdateAuxDevice string --
Request Message
Binary Data
Hikvision co MMC
adil@hikvision.co.az
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:it describes the error in details-->OK
</subStatusCode>
<description>
<!--ro, opt, string, custom error information, range:[0,1024], desc:this node is used for debugging-->badXmlFormat
</description>
</ResponseStatus>
Request URL
GET /ISAPI/System/upgradeStatus?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
"requestURL": "/ISAPI/Streaming/channels/1",
/*ro, opt, string, request URL*/
"statusCode": "test",
/*ro, req, string, status code*/
"statusString": "test",
/*ro, req, string, status description*/
"subStatusCode": "test",
/*ro, req, string, sub status code*/
"errorCode": 1,
/*ro, opt, int, This field is required when the value of statusCode is not 1, and it corresponds to subStatusCode.*/
"errorMsg": "ok",
/*ro, opt, string, This field is required when the value of statusCode is not 1. Detailed error description of a certain parameter can be provided*/
"upgrading": "TRUE",
```
/*ro, opt, string, whether the device is upgrading: “TRUE" (upgrading), "FALSE" (not in upgrading)*/
```
"percent": 22,
```
/*ro, opt, int, upgrade progress (% complete)*/
```
"idList": [
/*ro, opt, array, ID list, subType:object*/
```
{
```
"id": "test",
/*ro, req, string, analysis unit ID*/
"percent": 22,
```
/*ro, opt, int, upgrade progress (% complete)*/
```
"status": "test"
```
/*ro, opt, string, "backingUp" (backing up upgrade)*/
```
```
}
```
]
```
}
```
Request URL
GET /ISAPI/System/upgradeStatus?type=<type>&childDevID=<childDevID>&id=<id>
Query Parameter
12.1.5.3 Get the device upgrade progress
12.1.5.4 Get the device upgrading status and progress
Hikvision co MMC
adil@hikvision.co.az
Parameter Name Parameter Type Description
```
type string "usbmic" (array microphone module)
```
childDevID string --
id string The id indicates the peripheral No. to be upgraded.
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<upgradeStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, upgrade status and result, attr:version{req, string, protocolVersion}-->
```
<upgrading>
<!--ro, req, bool, upgrade status-->true
</upgrading>
<percent>
```
<!--ro, req, int, upgrade progress (% complete), range:[0,100]-->1
```
</percent>
<reboot>
```
<!--ro, opt, bool, dep:and,{$.upgradeStatus.percent,eq,100}-->false
```
</reboot>
<upgradeStage>
<!--ro, opt, enum, subType:string-->software
</upgradeStage>
</upgradeStatus>
Request URL
GET /ISAPI/System/time
Query Parameter
None
Request Message
None
Response Message
12.1.6 Time Management
12.1.6.1 Get device time synchronization management parameters
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<Time xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, time management, attr:version{opt, string, protocolVersion}-->
```
<timeMode>
```
<!--ro, req, enum, time synchronization mode, subType:string, desc:“NTP” (NTP time synchronization), “manual” (manual time synchronization), “satellite”
```
```
(satellite time synchronization), “platform” (platform time synchronization), “NONE” (time synchronization is not allowed or no time synchronization
```
```
source), “GB28181” (GB28181 time synchronization)-->NTP
```
</timeMode>
<localTime>
```
<!--ro, opt, string, local time, range:[0,256], dep:and,{$.Time.timeMode,eq,manual}-->2019-02-28T10:50:44+08:30
```
</localTime>
<timeZone>
```
<!--ro, opt, string, time zone, range:[0,256], dep:and,{$.Time.timeMode,eq,manual},{$.Time.timeMode,eq,NTP}, desc:daylight saving time configuration in
```
time zone-->CST-8:00:00DST00:30:00,M4.1.0/02:00:00,M10.5.0/02:00:00
</timeZone>
<satelliteInterval>
```
<!--ro, opt, int, satellite time synchronization interval, step:1, unit:min, dep:and,{$.Time.timeMode,eq,satellite}, desc:unit: minute-->60
```
</satelliteInterval>
<isSummerTime>
```
<!--ro, opt, bool, whether the device time returned currently is in DST (Daylight Saving Time) system, desc:whether the device time returned currently
```
```
is in DST (Daylight Saving Time) system-->true
```
</isSummerTime>
<platformType>
```
<!--ro, opt, enum, platform type, subType:string, dep:and,{$.Time.timeMode,eq,platform}, desc:exists only when the timeMode is selected as platform--
```
>EZVIZ
</platformType>
<platformNo>
```
<!--ro, opt, int, platform No., range:[1,2], dep:and,{$.Time.timeMode,eq,GB28181}, desc:it is the only ID, which is configured via platformNo in
```
GB28181List, related URI: /ISAPI/System/Network/SIP/<SIPServerID>-->1
</platformNo>
<ethernetPort>
```
<!--ro, opt, int, range:[0,255], dep:and,{$.Time.timeMode,eq,PTP}-->0
```
</ethernetPort>
<IANA>
<!--ro, opt, enum, subType:string-->Africa/Abidjan
</IANA>
<windowsZone>
<!--ro, opt, enum, subType:string-->Dateline Standard Time
</windowsZone>
<standard>
<!--ro, opt, enum, format, subType:string, desc:"PAL", "NTSC"-->PAL
</standard>
</Time>
Request URL
PUT /ISAPI/System/time
Query Parameter
None
Request Message
12.1.6.2 Set device time synchronization management parameters
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<Time xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--req, object, time management, attr:version{opt, string, protocolVersion}-->
```
<timeMode>
```
<!--req, enum, time synchronization mode, subType:string, desc:“NTP” (NTP time synchronization), “manual” (manual time synchronization), “satellite”
```
```
(satellite time synchronization), “platform” (platform time synchronization), “NONE” (time synchronization is not allowed or no time synchronization
```
```
source), “GB28181” (GB28181 time synchronization)-->NTP
```
</timeMode>
<localTime>
```
<!--opt, string, local time, range:[0,256], dep:and,{$.Time.timeMode,eq,manual}, desc:the time difference between local time and coordinated universal
```
```
time (UTC) is configured via the timeZone field-->2019-02-28T10:50:44
```
</localTime>
<timeZone>
```
<!--opt, string, time zone, range:[0,256], dep:and,{$.Time.timeMode,eq,manual},{$.Time.timeMode,eq,NTP}, desc:time zone-->CST-
```
8:00:00DST00:30:00,M4.1.0/02:00:00,M10.5.0/02:00:00
</timeZone>
<satelliteInterval>
```
<!--opt, int, satellite time synchronization interval, step:1, unit:min, dep:and,{$.Time.timeMode,eq,satellite}, desc:unit: minute-->60
```
</satelliteInterval>
<isSummerTime>
```
<!--ro, opt, bool, whether the time returned by the current device is that in the DST (daylight saving time), desc:whether the time returned by the
```
```
current device is that in the DST (daylight saving time)-->true
```
</isSummerTime>
<platformType>
```
<!--opt, enum, platform type, subType:string, dep:and,{$.Time.timeMode,eq,platform}, desc:exists only when the timeMode is selected as platform, related
```
```
URI: /ISAPI/System/Network/EZVIZ-->EZVIZ
```
</platformType>
<platformNo>
```
<!--opt, int, platform No., range:[1,2], dep:and,{$.Time.timeMode,eq,GB28181}, desc:it is the only ID, which is configured via platformNo in
```
GB28181List, related URI: /ISAPI/System/Network/SIP/<SIPServerID>-->1
</platformNo>
<ethernetPort>
```
<!--opt, int, range:[0,255], dep:and,{$.Time.timeMode,eq,PTP}-->0
```
</ethernetPort>
<IANA>
<!--opt, enum, subType:string-->Africa/Abidjan
</IANA>
<windowsZone>
<!--opt, enum, subType:string-->Dateline Standard Time
</windowsZone>
<standard>
<!--opt, enum, format, subType:string, desc:"PAL", "NTSC"-->PAL
</standard>
</Time>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, opt, string, request URL-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status description, subType:string, desc:“OK” (succeeded), “Device Busy”, “Device Error”, “Invalid Operation”, “Invalid XML Format”,
```
```
“Invalid XML Content”, “Reboot” (reboot device)-->OK
```
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
<reason>
<!--ro, opt, string, reason why the node failed to synchronize time, range:[0,128]-->test
</reason>
</FailedNodeInfo>
</FailedNodeInfoList>
<description>
<!--ro, opt, string, custom error message description, range:[0,1024], desc:the custom error message description returned by the application is used to
quickly identify and evaluate issues-->badXmlFormat
</description>
</ResponseStatus>
Hikvision co MMC
adil@hikvision.co.az
Request URL
GET /ISAPI/System/time/capabilities
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<Time xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, time management capability set, attr:version{opt, string, protocolVersion}-->
```
```
<timeMode opt="NTP,manual,satellite,SDK,28181,ONVIF,ALL(任何支持的校时方式都允许校时),NONE(不允校时或无校时源),platform,PTP">
```
```
<!--ro, req, enum, time synchronization mode, subType:string, attr:opt{opt, string}, desc:“NTP” (NTP time synchronization), “manual” (manual time
```
```
synchronization), “satellite” (satellite time synchronization), “platform” (platform time synchronization), “NONE” (time synchronization is not allowed or
```
```
no time synchronization source), “GB28181” (GB28181 time synchronization)-->NTP
```
</timeMode>
<localTime min="0" max="256">
```
<!--ro, opt, string, local time, range:[0,256], attr:min{opt, string},max{opt, string}-->test
```
</localTime>
<timeZone min="0" max="256">
```
<!--ro, opt, string, time zone, range:[0,256], attr:min{opt, string},max{opt, string}-->test
```
</timeZone>
<satelliteInterval min="0" max="3600">
```
<!--ro, opt, int, satellite time synchronization interval, step:1, unit:min, attr:min{opt, string},max{opt, string}, desc:unit: minute-->60
```
</satelliteInterval>
<timeType opt="local,UTC">
```
<!--ro, opt, enum, time type, subType:string, attr:opt{opt, string}, desc:“local” (local time), “UTC” (UTC time)-->local
```
</timeType>
<platformType opt="EZVIZ">
```
<!--ro, opt, enum, platform type, subType:string, dep:and,{$.Time.timeMode,eq,platform}, attr:opt{opt, string}, desc:platform type-->EZVIZ
```
</platformType>
<platformNo min="1" max="2">
```
<!--ro, opt, int, platform No., range:[1,2], dep:and,{$.Time.timeMode,eq,GB28181}, attr:min{req, int},max{req, int}, desc:it is the only ID, which is
```
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
```
<!--ro, opt, enum, time display format, subType:string, attr:opt{req, string}, desc:if this node is returned, it indicates that the device supports
```
configuring time display format, related URI: /ISAPI/System/time/timeType?format=json-->MM/dd/yyyy hh:mm
</displayFormat>
<isSupportSyncDeviceNTPInfoToCamera>
<!--ro, opt, bool, the capability of synchronizing device’s NTP service information with the camera, desc:related URI:
/ISAPI/System/time/SyncDeviceNTPInfoToCamera/capabilities?format=json-->true
</isSupportSyncDeviceNTPInfoToCamera>
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
```
<!--ro, opt, int, range:[0,255], dep:and,{$.Time.timeMode,eq,PTP}, attr:min{req, int},max{req, int}-->1
```
</ethernetPort>
<IANA
```
opt="Africa/Abidjan,Africa/Accra,Africa/Addis_Ababa,Africa/Algiers,Africa/Blantyre,Africa/Brazzaville,Africa/Cairo,Africa/Casablanca,Africa/Conakry,Africa/D
```
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
```
,Asia/Jerusalem,Asia/Kabul,Asia/Karachi,Asia/Kathmandu,Asia/Kuala_Lumpur,Asia/Kuwait,Asia/Macau(China),Asia/Manila,Asia/Muscat,Asia/Phnom_Penh,Asia/Pyongyan
```
g,Asia/Rangoon,Asia/Riyadh,Asia/Seoul,Asia/Shanghai,Asia/Singapore,Asia/Taipei,Asia/Tehran,Asia/Tel_Aviv,Asia/Tokyo,Asia/Ulaanbaatar,Atlantic/Bermuda,Atlant
ic/Canary,Atlantic/Cape_Verde,Atlantic/Reykjavik,Atlantic/Stanley,Australia/Adelaide,Australia/Brisbane,Australia/Canberra,Australia/Darwin,Australia/Melbou
rne,Australia/NSW,Australia/Perth,Australia/Queensland,Australia/Sydney,Australia/Victoria,Canada/Newfoundland,Canada/Saskatchewan,Chile/EasterIsland,Europe
/Amsterdam,Europe/Andorra,Europe/Athens,Europe/Belfast,Europe/Belgrade,Europe/Berlin,Europe/Bratislava,Europe/Brussels,Europe/Bucharest,Europe/Budapest,Euro
pe/Chisinau,Europe/Copenhagen,Europe/Dublin,Europe/Gibraltar,Europe/Helsinki,Europe/Isle_of_Man,Europe/Istanbul,Europe/Kiev,Europe/Lisbon,Europe/London,Euro
12.1.6.3 Get the capability of device time synchronization management
Hikvision co MMC
adil@hikvision.co.az
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
```
<!--ro, opt, enum, IANA synchronization, subType:string, attr:opt{opt, string}-->Africa/Abidjan
```
</IANA>
<isSupportSearchDeviceIANAList>
<!--ro, opt, bool, whether the device supports searching for supported IANA list, desc:POST /ISAPI/System/time/SearchDeviceIANAList?format=json-->true
</isSupportSearchDeviceIANAList>
<windowsZone opt="Dateline Standard Time,UTC-11,Aleutian Standard Time,Hawaiian Standard Time,Marquesas Standard Time,Alaskan Standard Time,UTC-09,Pacific
```
Standard Time (Mexico),UTC-08,Pacific Standard Time,US Mountain Standard Time,Mountain Standard Time (Mexico),Mountain Standard Time,Yukon Standard
```
```
Time,Central America Standard Time,Central Standard Time,Easter Island Standard Time,Central Standard Time (Mexico),Canada Central Standard Time,SA Pacific
```
```
Standard Time,Eastern Standard Time (Mexico),Eastern Standard Time,Haiti Standard Time,Cuba Standard Time,US Eastern Standard Time,Turks And Caicos Standard
```
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
```
<!--ro, opt, enum, subType:string, attr:opt{opt, string}-->Dateline Standard Time
```
</windowsZone>
<isSupportTimeStateParam>
<!--ro, opt, bool, desc:GET /ISAPI/System/time/TimeStateParam?format=json-->true
</isSupportTimeStateParam>
<localTimeDST min="0" max="256">
```
<!--ro, opt, string, range:[0,256], attr:min{opt, string},max{opt, string}-->test
```
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
Request URL
PUT /ISAPI/System/time/ntpServers
Query Parameter
None
Request Message
12.1.6.4 Set parameters of all NTP servers
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<NTPServerList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--req, array, NTP server information list, subType:object, attr:version{opt, string, protocolVersion}-->
```
<NTPServer>
<!--opt, object, NTP server information-->
<id>
<!--req, string, ID-->1
</id>
<addressingFormatType>
```
<!--req, enum, NTP server address type, subType:string, desc:"ipaddress" (IP address), "hostname" (domain name)-->hostname
```
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
<enabled>
```
<!--opt, bool, whether to enable, desc:disabled (by default)-->false
```
</enabled>
</NTPServer>
</NTPServerList>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL-->/ISAPI/xxxx
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status description, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/System/time/ntpServers
Query Parameter
None
Request Message
None
Response Message
```
12.1.6.5 Get the parameters of a specific NTP (Network Time Protocol) server
```
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<NTPServerList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, array, NTP server information list, subType:object, attr:version{req, string, protocolVersion}-->
```
<NTPServer>
<!--ro, opt, object, NTP server information-->
<id>
<!--ro, req, string, ID-->1
</id>
<addressingFormatType>
```
<!--ro, req, enum, NTP server address type, subType:string, desc:"ipaddress" (IP address), "hostname" (domain name)-->hostname
```
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
<enabled>
```
<!--ro, opt, bool, whether to enable, desc:disabled (by default)-->false
```
</enabled>
</NTPServer>
</NTPServerList>
Request URL
PUT /ISAPI/System/time/ntpServers/<NTPServerID>
Query Parameter
Parameter Name Parameter Type Description
NTPServerID string --
Request Message
<?xml version="1.0" encoding="UTF-8"?>
<NTPServer xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--req, object, NTP server information, attr:version{req, string, protocolVersion}-->
```
<id>
<!--req, string, ID-->1
</id>
<addressingFormatType>
```
<!--req, enum, IP address type of NTP server, subType:string, desc:"ipaddress" (IP address), "hostname" (domain name)-->hostname
```
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
<enabled>
<!--opt, bool-->false
</enabled>
</NTPServer>
Response Message
12.1.6.6 Set the parameters of a NTP server
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status description, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/System/time/ntpServers/<NTPServerID>
Query Parameter
Parameter Name Parameter Type Description
NTPServerID string NTP server No.
Request Message
None
Response Message
12.1.6.7 Get the parameters of a NTP server
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<NTPServer xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, NTP server information, attr:version{req, string, protocolVersion}-->
```
<id>
<!--ro, req, string, ID-->1
</id>
<addressingFormatType>
```
<!--ro, req, enum, IP address type of NTP server, subType:string, desc:"ipaddress" (IP address), "hostname" (domain name)-->hostname
```
</addressingFormatType>
<hostName>
```
<!--ro, opt, string, NTP server domain name, range:[1,64], dep:and,{$.NTPServer.addressingFormatType,eq,hostname}-->xxx12345
```
</hostName>
<ipAddress>
```
<!--ro, opt, string, IPv4 address, range:[1,32], dep:and,{$.NTPServer.addressingFormatType,eq,ipAddress}-->192.168.1.112
```
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
<enabled>
<!--ro, opt, bool-->false
</enabled>
<devicePortNoValid>
<!--ro, opt, enum, subType:string-->yes
</devicePortNoValid>
<portType>
<!--ro, opt, enum, subType:string-->auto
</portType>
<customPortNo>
```
<!--ro, opt, int, range:[1,65535], step:1, dep:and,{$.NTPServer.portType,eq,custom}-->1
```
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
Query Parameter
Parameter Name Parameter Type Description
NTPServerID string --
Request Message
None
Response Message
12.1.6.8 Get the configuration capability of a specific NTP server
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<NTPServer xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, NTP server information, attr:version{req, string, protocolVersion}-->
```
<id min="1" max="1">
```
<!--ro, req, string, ID, range:[0,1], attr:min{req, int},max{req, int}-->1
```
</id>
<addressingFormatType opt="ipaddress,hostname">
```
<!--ro, req, enum, IP address type of NTP server, subType:string, attr:opt{req, string}, desc:"ipaddress" (IP address), "hostname" (domain name)--
```
>hostname
</addressingFormatType>
<hostName min="0" max="68">
```
<!--ro, opt, string, NTP server domain name, range:[0,68], attr:min{req, int},max{req, int}-->time.windows.com
```
</hostName>
<ipAddress min="0" max="32">
```
<!--ro, opt, string, IPv4 address, range:[0,32], attr:min{req, int},max{req, int}, desc:IPv4 address-->192.168.1.112
```
</ipAddress>
<ipv6Address min="0" max="128">
```
<!--ro, opt, string, IPv6 address, range:[0,128], attr:min{req, int},max{req, int}, desc:IPv6 address-->1030::C9B4:FF12:48AA:1A2B
```
</ipv6Address>
<portNo min="0" max="65535">
```
<!--ro, opt, int, port No., range:[0,65535], attr:min{req, int},max{req, int}, desc:port No.-->123
```
</portNo>
<synchronizeInterval min="0" max="10800">
```
<!--ro, opt, int, time synchronization interval, range:[0,10800], unit:min, attr:min{req, int},max{req, int}, desc:NTP time synchronization interval,
```
```
unit: minute-->1440
```
</synchronizeInterval>
<enabled opt="true,false">
```
<!--ro, opt, bool, attr:opt{req, string}-->true
```
</enabled>
<portType opt="auto,custom" def="auto">
```
<!--ro, opt, enum, subType:string, attr:opt{req, string},def{req, string}-->auto
```
</portType>
<customPortNo min="1" max="65535">
```
<!--ro, opt, int, range:[0,65535], dep:and,{$.NTPServer.portType,eq,custom}, attr:min{req, int},max{req, int}-->123
```
</customPortNo>
</NTPServer>
Request URL
GET /ISAPI/System/time/ntpServers/capabilities
Query Parameter
None
Request Message
None
Response Message
```
12.1.6.9 Get the configuration capability of parameters of a specific NTP (Network Time Protocol) server
```
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<NTPServerList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, array, NTP server information list, subType:object, attr:version{opt, string, protocolVersion}-->
```
<NTPServer>
<!--ro, opt, object, NTP server information-->
<id>
<!--ro, req, string, ID-->1
</id>
<addressingFormatType opt="ipaddress,hostname">
```
<!--ro, req, enum, NTP server address type, subType:string, attr:opt{req, string}, desc:"ipaddress" (IP address), "hostname" (domain name)-->hostname
```
</addressingFormatType>
<hostName min="1" max="64">
```
<!--ro, opt, string, NTP server domain name, range:[1,64], attr:min{req, int},max{req, int}-->12345
```
</hostName>
<ipAddress min="1" max="32">
```
<!--ro, opt, string, IPv4 address, range:[1,32], attr:min{req, int},max{req, int}, desc:IPv4 address-->192.168.1.112
```
</ipAddress>
<ipv6Address min="1" max="128">
```
<!--ro, opt, string, IPv6 address, range:[1,128], attr:min{req, int},max{req, int}, desc:IPv6 address-->1030:C9B4:FF12:48AA:1A2B
```
</ipv6Address>
<portNo min="1" max="65535">
```
<!--ro, opt, int, port No., range:[1,65535], attr:min{req, int},max{req, int}, desc:the default port No. is 123-->123
```
</portNo>
<synchronizeInterval min="1" max="10800">
```
<!--ro, opt, int, time synchronization interval, unit:min, attr:min{req, int},max{req, int}-->1440
```
</synchronizeInterval>
<enabled opt="true,false">
```
<!--ro, opt, bool, whether to enable, attr:opt{req, string}, desc:true (enable), false (disable)-->true
```
</enabled>
</NTPServer>
</NTPServerList>
Request URL
DELETE /ISAPI/Event/notification/httpHosts
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, opt, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, which describes the error in details, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
<description>
<!--ro, opt, string, custom error message description, range:[0,1024], desc:the custom error message description returned by the application is used to
quickly identify and evaluate issues-->badXmlFormat
</description>
<MErrCode>
<!--ro, opt, string, error codes categorized by functional modules, desc:all general error codes are in the range of this field-->0x00000000
</MErrCode>
<MErrDevSelfEx>
<!--ro, opt, string, error codes categorized by functional modules, desc:N/A-->0x00000000
</MErrDevSelfEx>
</ResponseStatus>
12.2 Network Configuration
12.2.1 HTTP Listening Management
```
12.2.1.1 Delete receiving server(s)
```
Hikvision co MMC
adil@hikvision.co.az
Request URL
DELETE /ISAPI/Event/notification/httpHosts/<hostID>
Query Parameter
Parameter
Name
Parameter
Type Description
hostID string Add a single alarm host through POST /ISAPI/Event/notification/httpHosts?security=&iv=.It returns the alarm host ID for success.
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, opt, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
<!--ro, req, enum, status code, subType:int, desc:0-OK, 1-OK, 2-Device Busy, 3-Device Error, 4-Invalid Operation, 5-Invalid XML Format, 6-Invalid XML
Content, 7-Reboot Required-->0
</statusCode>
<statusString>
```
<!--ro, req, enum, status description, subType:string, desc:“OK” (succeeded), “Device Busy”, “Device Error”, “Invalid Operation”, “Invalid XML Format”,
```
```
“Invalid XML Content”, “Reboot” (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code-->OK
</subStatusCode>
<description>
<!--ro, opt, string, custom error message description, range:[0,1024], desc:the custom error message description returned by the application is used to
quickly identify and evaluate issues-->badXmlFormat
</description>
<MErrCode>
<!--ro, opt, string, error codes categorized by functional modules, desc:all general error codes are in the range of this field-->0x00000000
</MErrCode>
<MErrDevSelfEx>
<!--ro, opt, string, error codes categorized by functional modules, desc:N/A-->0x00000000
</MErrDevSelfEx>
</ResponseStatus>
Request URL
PUT /ISAPI/Event/notification/httpHosts/<hostID>
Query Parameter
Parameter
Name
Parameter
Type Description
```
hostID string Security control panel ID, which is returned by the URL (POST/ISAPI/Event/notification/httpHosts?security=&iv=).
```
Request Message
<?xml version="1.0" encoding="UTF-8"?>
<HttpHostNotification xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--req, object, listening host, attr:version{req, string, protocolVersion}-->
```
<id>
<!--req, string, listening host ID, range:[1,10]-->test
</id>
<url>
<!--req, string, URL-->test
</url>
<protocolType>
```
<!--req, enum, protocol type, subType:string, desc:"HTTP", "HTTPS", "EHome" (ISUP)-->HTTP
```
</protocolType>
<parameterFormatType>
12.2.1.2 Delete a HTTP listening server
12.2.1.3 Set the parameters of a listening host
Hikvision co MMC
adil@hikvision.co.az
<parameterFormatType>
<!--req, enum, parameter format type, subType:string, desc:"JSON", "XML"-->JSON
</parameterFormatType>
<addressingFormatType>
<!--req, enum, address type, subType:string, desc:"hostname", "ipaddress"-->hostname
</addressingFormatType>
<hostName>
```
<!--opt, string, host name, dep:and,{$.HttpHostNotification.addressingFormatType,eq,hostName}-->test
```
</hostName>
<ipAddress>
```
<!--opt, string, IP address, dep:or,{$.HttpHostNotification.addressingFormatType,eq,ipAddress}, desc:IP address-->test
```
</ipAddress>
<ipv6Address>
```
<!--opt, string, IPv6 Address, dep:or,{$.HttpHostNotification.addressingFormatType,eq,ipAddress}, desc:IPv6 Address-->test
```
</ipv6Address>
<portNo>
<!--opt, int, port number-->1
</portNo>
<userName>
```
<!--opt, string, user name, dep:and,{$.HttpHostNotification.httpAuthenticationMethod,ue,none}-->test
```
</userName>
<password>
```
<!--wo, opt, string, password, dep:and,{$.HttpHostNotification.httpAuthenticationMethod,ue,none}-->test
```
</password>
<httpAuthenticationMethod>
```
<!--req, enum, authentication method, subType:string, desc:"MD5digest"(MD5), "none", "base64"-->MD5digest
```
</httpAuthenticationMethod>
<ANPR>
<!--opt, object, ANPR-->
<detectionUpLoadPicturesType>
```
<!--opt, enum, uploaded pictures type, subType:string, desc:"all", "licensePlatePicture", "detectionPicture"(detected picture)-->all
```
</detectionUpLoadPicturesType>
<videoUploadEnabled>
<!--opt, bool, whether to upload violation pre-records, desc:when it is enabled, the device will upload the stored video via the "relationVideo"
event-->false
</videoUploadEnabled>
</ANPR>
<Extensions>
<!--opt, object, range-->
<intervalBetweenEvents>
<!--opt, int, event interval-->1
</intervalBetweenEvents>
</Extensions>
<uploadImagesDataType>
```
<!--opt, enum, picture data type, subType:string, desc:"URL", "binary" (default value). For cloud storage, only "URL" is supported-->URL
```
</uploadImagesDataType>
<httpBroken>
<!--opt, bool, whether to enable the automatic network replenishment, desc:if the ANR function is enabled, it will be applied to all events-->true
</httpBroken>
<SubscribeEvent>
<!--opt, object, picture uploading modes of all events which contain pictures, desc:picture uploading modes of all events which contain pictures-->
<heartbeat>
<!--opt, int, Heartbeat Interval Time-->30
</heartbeat>
<eventMode>
```
<!--req, enum, event mode, subType:string, desc:"all" (all alarms need to be reported), "list" (only listed alarms need to be reported)-->all
```
</eventMode>
<EventList>
<!--opt, array, event list, subType:object-->
<Event>
<!--opt, object, channel information linked to event-->
<type>
```
<!--req, enum, event type, subType:string, desc:see details in event types: "ADAS"(advanced driving assistance system), "ADASAlarm"(advanced
```
```
driving assistance alarm), "AID"(traffic incident detection), "ANPR"(automatic number plate recognition), "AccessControllerEvent", "CDsStatus", "DBD"
```
```
(driving behavior detection) "GPSUpload", "HFPD"(frequently appeared person), "IO"(I/O Alarm), "IOTD", "LES", "LFPD"(low frequency person detection),
```
```
"PALMismatch", "PIR", "PeopleCounting", "PeopleNumChange", "Standup"(standing up detection), "TMA"(thermometry alarm), "TMPA"(temperature measurement pre-
```
```
alarm), "VMD"(motion detection), "abnormalAcceleration", "abnormalDriving", "advReachHeight", "alarmResult", "attendance", "attendedBaggage",
```
```
"audioAbnormal", "audioexception", "behaviorResult"(abnormal event detection), "blindSpotDetection"(blind spot detection alarm), "cardMatch",
```
```
"changedStatus", "collision", "containerDetection", "crowdSituationAnalysis", "databaseException", "defocus"(defocus detection), "diskUnformat"(disk
```
```
unformatted), "diskerror", "diskfull", "driverConditionMonitor"(driver status monitoring alarm); "emergencyAlarm", "faceCapture", "faceSnapModeling",
```
```
"facedetection", "failDown"(People Falling Down), "faultAlarm", "fielddetection"(intrusion detection), "fireDetection", "fireEscapeDetection",
```
```
"flowOverrun", "framesPeopleCounting", "getUp"(getting up detection), "group" (people gathering), "hdBadBlock"(HDD bad sector detection event), "hdImpact"
```
```
(HDD impact detection event), "heatmap"(heat map alarm), "highHDTemperature"(HDD high temperature detection event), "highTempAlarm"(HDD high temperature
```
```
alarm), "hotSpare"(hot spare exception), "illaccess"(invalid access), "ipcTransferAbnormal", "ipconflict"(IP address conflicts), "keyPersonGetUp"(key person
```
```
getting up detection), "leavePosition"(absence detection), "linedetection"(line crossing detection), "listSyncException"(list synchronization exception),
```
```
"loitering"(loitering detection), "lowHDTemperature"(HDD low temperature detection event), "mixedTargetDetection"(multi-target-type detection),
```
```
"modelError", "nicbroken"(network disconnected), "nodeOffline"(node disconnected), "nonPoliceIntrusion", "overSpeed"(overspeed alarm), "overtimeTarry"
```
```
(staying overtime detection), "parking"(parking detection), "peopleNumChange", "peopleNumCounting", "personAbnormalAlarm"(person ID exception alarm),
```
```
"personDensityDetection", "personQueueCounting", "personQueueDetection", "personQueueRealTime"(real-time data of people queuing-up detection),
```
```
"personQueueTime"(waiting time detection), "playCellphone"(playing mobile phone detection), "pocException"(video exception), "poe"(POE power exception),
```
```
"policeAbsent", "radarAlarm", "radarFieldDetection", "radarLineDetection", "radarPerimeterRule"(radar rule data), "radarTargetDetection",
```
```
"radarVideoDetection"(radar-assisted target detection), "raidException", "rapidMove", "reachHeight"(climbing detection), "recordCycleAbnormal"(insufficient
```
```
recording period), "recordException", "regionEntrance", "regionExiting", "retention"(people overstay detection), "rollover", "running"(people running),
```
```
"safetyHelmetDetection"(hard hat detection), "scenechangedetection", "sensorAlarm"(angular acceleration alarm), "severeHDFailure"(HDD major fault
```
```
detection), "shelteralarm"(video tampering alarm), "shipsDetection", "sitQuietly"(sitting detection), "smokeAndFireDetection", "smokeDetection", "softIO",
```
```
"spacingChange"(distance exception), "sysStorFull"(storaging full alarm of cluster system), "takingElevatorDetection"(elevator electric moped detection),
```
```
"targetCapture", "temperature"(temperature difference alarm), "thermometry"(temperature alarm), "thirdPartyException", "toiletTarry"(in-toilet overtime
```
```
detection), "tollCodeInfo"(QR code information report), "tossing"(thrown object detection), "unattendedBaggage", "vehicleMatchResult"(uploading list
```
```
alarms), "vehicleRcogResult", "versionAbnormal"(cluster version exception), "videoException", "videoloss", "violationAlarm", "violentMotion"(violent motion
```
```
detection), "yardTarry"(playground overstay detection), "AccessControllerEvent", "IDCardInfoEvent", "FaceTemperatureMeasurementEvent", "QRCodeEvent"(QR code
```
```
event of access control), "CertificateCaptureEvent"(person ID capture comparison event), "UncertificateCompareEvent",
```
```
"ConsumptionAndTransactionRecordEvent", "ConsumptionEvent", "TransactionRecordEvent", "SetMealQuery"(searching consumption set meals),
```
```
"ConsumptionStatusQuery"(searching the consumption status), "humanBodyComparison"-->mixedTargetDetection
```
</type>
Hikvision co MMC
adil@hikvision.co.az
<minorAlarm>
<!--opt, string, minor alarm type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event is
"AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorAlarm>
<minorException>
<!--opt, string, minor exception type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event
is "AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorException>
<minorOperation>
<!--opt, string, minor operation type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event
is "AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorOperation>
<minorEvent>
<!--opt, string, minor event type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event is
"AccessControllerEvent"-->0x01,0x02,0x03,0x04
</minorEvent>
<pictureURLType>
```
<!--opt, enum, alarm picture format of the specified event, subType:string, desc:"binary", "localURL" (local URL), "cloudStorageURL" (cloud
```
```
storage URL), "EZVIZURL" (EZ URL)-->binary
```
</pictureURLType>
<channels>
<!--opt, string, listen to the events on the specified channel No. list, desc:if all channels are being listened to, the node shall not be
applied. if some channels are being listened to, the channel No. shall be listed and separated by commas-->1,2,3,4
</channels>
</Event>
</EventList>
<channels>
<!--opt, string, listen to the specified channel No. list, desc:if all channels are being listened to, the node shall not be applied. if some channels
are being listened to, the channel No. shall be listed and separated by commas-->1,2,3,4
</channels>
<pictureURLType>
```
<!--opt, enum, alarm picture format, subType:string, desc:"binary", "localURL" (local URL), "cloudStorageURL" (cloud storage URL), "EZVIZURL" (EZ
```
```
URL). The node indicates the upload mode of all event pictures. If the node is applied, <pictureURLType> of <Event> will be invalid. If the node is not
```
applied, the pictures are uploaded in the default mode. The default data type of uploaded pictures for front-end devices is binary, and for back-end devices
is local URL of the device-->binary
</pictureURLType>
<ChangedUploadSub>
<!--opt, object, subscribe to messages-->
<interval>
<!--opt, int, the lifecycle of arming GUID, desc:within the interval, if the client software does not reconnect to the device, a new GUID will be
generated by the device-->5
</interval>
<StatusSub>
<!--opt, object, sub status-->
<all>
<!--opt, bool, whether to subscribe to all-->true
</all>
<channel>
```
<!--opt, bool, channel subscription status (whether the channel is subscribed), desc:it is not required if the value of <all> is true-->true
```
</channel>
<hd>
```
<!--opt, bool, HDD subscription status (whether the HDD is subscribed), desc:it is not required if the value of <all> is true-->true
```
</hd>
<capability>
```
<!--opt, bool, subscription status of capability set change (whether the capability set change is subscribed), desc:it is not required if the
```
value of <all> is true-->true
</capability>
</StatusSub>
</ChangedUploadSub>
</SubscribeEvent>
<PackingSpaceRecognition>
<!--opt, object, current control parameters of event listened by parking space detector on the security control panel, desc:related event:
PackingSpaceRecognition-->
<upLoadPicturesType>
```
<!--req, enum, uploaded picture type, subType:string, desc:"all", "picturesTypes" (upload specified types of pictures), "notUpload" (not upload
```
```
pictures)-->all
```
</upLoadPicturesType>
<PicturesTypes>
<!--opt, array, specified list of uploaded picture type, subType:object, dep:and,
```
{$.HttpHostNotification.PackingSpaceRecognition.upLoadPicturesType,eq,picturesTypes}-->
```
<picturesType>
```
<!--opt, enum, uploaded picture type, subType:string, desc:"backgroundImage" (captured background picture), "plateImage" (license plate thumbnail)--
```
>backgroundImage
</picturesType>
</PicturesTypes>
</PackingSpaceRecognition>
<fileUploadType>
<!--opt, enum, subType:string-->cloudStrage
</fileUploadType>
<enabled>
<!--opt, bool, whether to enable-->true
</enabled>
<netWork>
<!--opt, enum, network, subType:int, desc:multi-NIC devices support the access via wired/wireless/mobile networks. After the network switching, the
device's upload center address will be invalid. So, it is required to configure the valid network to avoid event upload failure due to invalid network 1
```
(wired network), 2 (mobile network: 3G/4G/5G/GPRS), 3 (wireless network)-->1
```
</netWork>
<method>
<!--opt, enum, request method, subType:string, desc:"POST", "PUT", "GET"-->POST
</method>
<pictureAttachEnabled>
<!--opt, bool, whether to enable attaching pictures, desc:true by default-->true
</pictureAttachEnabled>
<contentType>
Hikvision co MMC
adil@hikvision.co.az
<contentType>
```
<!--opt, enum, HTTP content format, subType:string, desc:"multipart" (form format) by default. It is the format for all uploaded events, not limited to
```
pictures only-->multipart
</contentType>
<eventTemplateID>
```
<!--opt, int, event message template ID, desc:related URL (GET /ISAPI/Event/notification/EventTemplateParams?format=json) is to get template list-->1
```
</eventTemplateID>
<customTriggersEnabled>
```
<!--opt, bool, whether to enable custom linkage, desc:true (listening service's linkage method is unaffected by upload center's linkage method, that is,
```
```
independent), false or node doesn't exist (use the previous logic, that upload center sends data to listening service)-->false
```
</customTriggersEnabled>
<checkResponseEnabled>
<!--opt, bool, whether to enable verifying listening host response, desc:when a device uploads an event to the listening host, the host should respond
with HTTP 200 OK status. Otherwise, the device assumes that the event was not received. However, some platforms' listening services fail to respond. This
parameter is used to address the actual cause. When disabled, the device skips the verification of 200 OK response from the listening host. When enabled,
failure to receive 200 OK indicates the event upload failure, and the device will log the failure or retransmit the event-->true
</checkResponseEnabled>
</HttpHostNotification>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, opt, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status description, subType:string, desc:"OK"(succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot"(reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code-->OK
</subStatusCode>
<description>
<!--ro, opt, string, custom error message description, range:[0,1024], desc:the custom error message description returned by the application is used to
quickly identify and evaluate issues-->badXmlFormat
</description>
<MErrCode>
<!--ro, opt, string, error codes categorized by functional modules, desc:all general error codes are in the range of this field-->0x00000000
</MErrCode>
<MErrDevSelfEx>
<!--ro, opt, string, error codes categorized by functional modules, desc:N/A-->0x00000000
</MErrDevSelfEx>
</ResponseStatus>
Request URL
GET /ISAPI/Event/notification/httpHosts/<hostID>
Query Parameter
Parameter
Name
Parameter
Type Description
```
hostID string Security control panel ID, which is returned by the URL (POST/ISAPI/Event/notification/httpHosts?security=&iv=).
```
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<HttpHostNotification xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, listening host, attr:version{req, string, protocolVersion}-->
```
<id>
<!--ro, req, string, listening host ID, range:[1,10]-->test
</id>
<url>
<!--ro, req, string, URL-->test
</url>
<protocolType>
<!--ro, req, enum, protocol type, subType:string, desc:"HTTP", "HTTPS", "EHome"-->HTTP
12.2.1.4 Get the parameters of a listening host
Hikvision co MMC
adil@hikvision.co.az
<!--ro, req, enum, protocol type, subType:string, desc:"HTTP", "HTTPS", "EHome"-->HTTP
</protocolType>
<parameterFormatType>
<!--ro, req, enum, parameter format type, subType:string, desc:"JSON", "XML"-->JSON
</parameterFormatType>
<addressingFormatType>
<!--ro, req, enum, address type, subType:string, desc:"hostname", "ipaddress"-->hostname
</addressingFormatType>
<hostName>
```
<!--ro, opt, string, host name, dep:and,{$.HttpHostNotification.addressingFormatType,eq,hostName}-->test
```
</hostName>
<ipAddress>
```
<!--ro, opt, string, IP address, dep:or,{$.HttpHostNotification.addressingFormatType,eq,ipAddress}, desc:IP address-->test
```
</ipAddress>
<ipv6Address>
```
<!--ro, opt, string, IPv6 address, dep:or,{$.HttpHostNotification.addressingFormatType,eq,ipAddress}, desc:IPv6 address-->test
```
</ipv6Address>
<portNo>
<!--ro, opt, int, port number-->1
</portNo>
<userName>
```
<!--ro, opt, string, user name, dep:and,{$.HttpHostNotification.httpAuthenticationMethod,eq,MD5digest}-->test
```
</userName>
<httpAuthenticationMethod>
```
<!--ro, req, enum, authentication method, subType:string, desc:"MD5digest" (MD5), "none", "base64"-->MD5digest
```
</httpAuthenticationMethod>
<ANPR>
<!--ro, opt, object, ANPR-->
<detectionUpLoadPicturesType>
```
<!--ro, opt, enum, uploaded pictures type, subType:string, desc:"all", "licensePlatePicture" (license plate picture), "detectionPicture" (detected
```
```
picture)-->all
```
</detectionUpLoadPicturesType>
<videoUploadEnabled>
<!--ro, opt, bool, whether to upload violation pre-records, desc:when it is enabled, the device will upload the stored video via the "relationVideo"
event-->false
</videoUploadEnabled>
</ANPR>
<Extensions>
<!--ro, opt, object, range-->
<intervalBetweenEvents>
<!--ro, opt, int, event interval-->1
</intervalBetweenEvents>
</Extensions>
<uploadImagesDataType>
```
<!--ro, opt, enum, picture data type, subType:string, desc:"URL", "binary" (default value). For cloud storage, only "URL" is supported-->URL
```
</uploadImagesDataType>
<httpBroken>
<!--ro, opt, bool, whether to enable the automatic network replenishment, desc:if the ANR function is enabled, it will be applied to all events-->true
</httpBroken>
<SubscribeEvent>
<!--ro, opt, object, picture uploading modes of all events which contain pictures-->
<heartbeat>
<!--ro, opt, int, heartbeat interval time-->30
</heartbeat>
<eventMode>
```
<!--ro, req, enum, event mode, subType:string, desc:"all" (all alarms need to be reported), "list" (only listed alarms need to be reported)-->all
```
</eventMode>
<EventList>
<!--ro, opt, array, event list, subType:object-->
<Event>
<!--ro, opt, object, channel information linked to event-->
<type>
```
<!--ro, req, enum, event type, subType:string, desc:refer to event type list (eventType): "ADAS"(advanced driving assistance system), "ADASAlarm"
```
```
(advanced driving assistance alarm), "AID"(traffic incident detection), "ANPR"(automatic number plate recognition), "AccessControllerEvent" (access
```
```
controller event), "CDsStatus" (CD burning status), "DBD"(driving behavior detection) "GPSUpload" (GPS information upload), "HFPD"(frequently appeared
```
```
person detection), "IO"(I/O alarm), "IOTD" (IoT device detection), "LES" (logistics scanning event), "LFPD"(rarely appeared person detection), "PALMismatch"
```
```
(video standard mismatch), "PIR", "PeopleCounting" (people counting), "PeopleNumChange" (people number change detection), "Standup"(standing up detection),
```
```
"TMA"(thermometry alarm), "TMPA"(temperature measurement pre-alarm), "VMD"(motion detection), "abnormalAcceleration", "abnormalDriving", "advReachHeight",
```
```
"alarmResult", "attendance", "attendedBaggage", "audioAbnormal", "audioexception", "behaviorResult"(abnormal event detection), "blindSpotDetection"(blind
```
```
spot detection alarm), "cardMatch", "changedStatus", "collision", "containerDetection", "crowdSituationAnalysis", "databaseException", "defocus"(defocus
```
```
detection), "diskUnformat"(disk unformatted), "diskerror", "diskfull", "driverConditionMonitor"(driver status monitoring alarm); "emergencyAlarm",
```
```
"faceCapture", "faceSnapModeling", "facedetection", "failDown"(People Falling Down), "faultAlarm", "fielddetection"(intrusion detection), "fireDetection",
```
```
"fireEscapeDetection", "flowOverrun", "framesPeopleCounting", "getUp"(getting up detection), "group" (people gathering), "hdBadBlock"(HDD bad sector
```
```
detection event), "hdImpact"(HDD impact detection event), "heatmap"(heat map alarm), "highHDTemperature"(HDD high temperature detection event),
```
```
"highTempAlarm"(HDD high temperature alarm), "hotSpare"(hot spare exception), "illaccess"(invalid access), "ipcTransferAbnormal", "ipconflict"(IP address
```
```
conflicts), "keyPersonGetUp"(key person getting up detection), "leavePosition"(absence detection), "linedetection"(line crossing detection),
```
```
"listSyncException"(list synchronization exception), "loitering"(loitering detection), "lowHDTemperature"(HDD low temperature detection event),
```
```
"mixedTargetDetection"(multi-target-type detection), "modelError", "nicbroken"(network disconnected), "nodeOffline"(node disconnected),
```
```
"nonPoliceIntrusion", "overSpeed"(overspeed alarm), "overtimeTarry"(staying overtime detection), "parking"(parking detection), "peopleNumChange",
```
```
"peopleNumCounting", "personAbnormalAlarm"(person ID exception alarm), "personDensityDetection", "personQueueCounting", "personQueueDetection",
```
```
"personQueueRealTime"(real-time data of people queuing-up detection), "personQueueTime"(waiting time detection), "playCellphone"(playing mobile phone
```
```
detection), "pocException"(video exception), "poe"(POE power exception), "policeAbsent", "radarAlarm", "radarFieldDetection", "radarLineDetection",
```
```
"radarPerimeterRule"(radar rule data), "radarTargetDetection", "radarVideoDetection"(radar-assisted target detection), "raidException", "rapidMove",
```
```
"reachHeight"(climbing detection), "recordCycleAbnormal"(insufficient recording period), "recordException", "regionEntrance", "regionExiting", "retention"
```
```
(people overstay detection), "rollover", "running"(people running), "safetyHelmetDetection"(hard hat detection), "scenechangedetection", "sensorAlarm"
```
```
(angular acceleration alarm), "severeHDFailure"(HDD major fault detection), "shelteralarm"(video tampering alarm), "shipsDetection", "sitQuietly"(sitting
```
```
detection), "smokeAndFireDetection", "smokeDetection", "softIO", "spacingChange"(distance exception), "sysStorFull"(storaging full alarm of cluster system),
```
```
"takingElevatorDetection"(elevator electric moped detection), "targetCapture", "temperature"(temperature difference alarm), "thermometry"(temperature
```
```
alarm), "thirdPartyException", "toiletTarry"(in-toilet overtime detection), "tollCodeInfo"(QR code information report), "tossing"(thrown object detection),
```
```
"unattendedBaggage", "vehicleMatchResult"(uploading list alarms), "vehicleRcogResult", "versionAbnormal"(cluster version exception), "videoException",
```
```
"videoloss", "violationAlarm", "violentMotion"(violent motion detection), "yardTarry"(playground overstay detection), "AccessControllerEvent",
```
```
"IDCardInfoEvent", "FaceTemperatureMeasurementEvent", "QRCodeEvent"(QR code event of access control), "CertificateCaptureEvent"(person ID capture comparison
```
```
event), "UncertificateCompareEvent", "ConsumptionAndTransactionRecordEvent", "ConsumptionEvent", "TransactionRecordEvent", "SetMealQuery"(searching
```
```
consumption set meals), "ConsumptionStatusQuery"(searching the consumption status), "humanBodyComparison" (human body comparison),
```
```
"regionTargetNumberCounting" (regional target statistics)-->mixedTargetDetection
```
Hikvision co MMC
adil@hikvision.co.az
```
"regionTargetNumberCounting" (regional target statistics)-->mixedTargetDetection
```
</type>
<minorAlarm>
<!--ro, opt, string, alarm sub type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event
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
```
<!--ro, opt, enum, alarm picture format of the specified event, subType:string, desc:"binary", "localURL" (local URL), "cloudStorageURL" (cloud
```
```
storage URL), "EZVIZURL" (EZ URL)-->binary
```
</pictureURLType>
<channels>
<!--ro, opt, string, listen to the events on the specified channel No. list, desc:if all channels are being listened to, the node shall not be
applied. If some channels are being listened to, the channel No. shall be listed and separated by commas-->1,2,3,4
</channels>
</Event>
</EventList>
<channels>
<!--ro, opt, string, listen to the specified channel No. list, desc:if all channels are being listened to, the node shall not be applied. If some
channels are being listened to, the channel No. shall be listed and separated by commas-->1,2,3,4
</channels>
<pictureURLType>
```
<!--ro, opt, enum, alarm picture format, subType:string, desc:"binary", "localURL" (local URL), "cloudStorageURL" (cloud storage URL), "EZVIZURL" (EZ
```
```
URL). The node indicates the upload mode of all event pictures. If the node is applied, <pictureURLType> of <Event> will be invalid. If the node is not
```
applied, the pictures are uploaded in the default mode. The default data type of uploaded pictures for front-end devices is binary, and for back-end devices
is local URL of the device-->binary
</pictureURLType>
<ChangedUploadSub>
<!--ro, opt, object, subscribe to messages-->
<interval>
<!--ro, opt, int, the lifecycle of arming GUID, desc:within the interval, if the client software does not reconnect to the device, a new GUID will
be generated by the device-->5
</interval>
<StatusSub>
<!--ro, opt, object, sub status-->
<all>
<!--ro, opt, bool, whether to subscribe to all-->true
</all>
<channel>
```
<!--ro, opt, bool, channel subscription status (whether the channel is subscribed), desc:it is not required if the value of <all> is true-->true
```
</channel>
<hd>
```
<!--ro, opt, bool, HDD subscription status (whether the HDD is subscribed), desc:it is not required if the value of <all> is true-->true
```
</hd>
<capability>
```
<!--ro, opt, bool, subscription status of capability set change (whether the capability set change is subscribed), desc:it is not required if the
```
value of <all> is true-->true
</capability>
</StatusSub>
</ChangedUploadSub>
</SubscribeEvent>
<PackingSpaceRecognition>
<!--ro, opt, object, current control parameters of event listened by parking space detector on the security control panel, desc:related event:
PackingSpaceRecognition-->
<upLoadPicturesType>
```
<!--ro, req, enum, uploaded picture type, subType:string, desc:"all", "picturesTypes"(upload specified types of pictures), "notUpload"(not upload
```
```
pictures)-->all
```
</upLoadPicturesType>
<PicturesTypes>
<!--ro, opt, array, specified list of uploaded picture types, subType:object, dep:and,
```
{$.HttpHostNotification.PackingSpaceRecognition.upLoadPicturesType,eq,picturesTypes}-->
```
<picturesType>
```
<!--ro, opt, enum, uploaded picture type, subType:string, desc:"backgroundImage"(captured background picture), "plateImage"(license plate
```
```
thumbnail)-->backgroundImage
```
</picturesType>
</PicturesTypes>
</PackingSpaceRecognition>
<enabled>
<!--ro, opt, bool, whether to enable-->true
</enabled>
<netWork>
```
<!--ro, opt, enum, network, subType:int, desc:1 (wired network), 2 (mobile network: 3G/4G/5G/GPRS), 3 (wireless network)-->1
```
</netWork>
<method>
<!--ro, opt, enum, request method, subType:string, desc:"POST", "PUT", "GET"-->POST
</method>
<pictureAttachEnabled>
<!--ro, opt, bool, whether to enable attaching pictures, desc:true by default-->true
</pictureAttachEnabled>
<contentType>
```
<!--ro, opt, enum, HTTP content format, subType:string, desc:"multipart" (form format) by default. It is the format for all uploaded events, not limited
```
to pictures only-->multipart
</contentType>
Hikvision co MMC
adil@hikvision.co.az
</contentType>
<eventTemplateID>
```
<!--ro, opt, int, event message template ID, desc:related URL (GET /ISAPI/Event/notification/EventTemplateParams?format=json) is to get template list--
```
>1
</eventTemplateID>
<customTriggersEnabled>
```
<!--ro, opt, bool, whether to enable custom linkage, desc:true (listening service's linkage method is unaffected by upload center's linkage method, that
```
```
is, independent), false or node doesn't exist (use the previous logic, that upload center sends data to listening service)-->false
```
</customTriggersEnabled>
<checkResponseEnabled>
<!--ro, opt, bool, whether to enable verifying listening host response, desc:when a device uploads an event to the listening host, the host should
respond with HTTP 200 OK status. Otherwise, the device assumes that the event was not received. However, some platforms' listening services fail to respond.
This parameter is used to address the actual cause. When disabled, the device skips the verification of 200 OK response from the listening host. When
enabled, failure to receive 200 OK indicates the event upload failure, and the device will log the failure or retransmit the event-->false
</checkResponseEnabled>
</HttpHostNotification>
Request URL
GET /ISAPI/Event/notification/httpHosts/capabilities?type=<type>
Query Parameter
Parameter
Name
Parameter
Type Description
type enum
custom refers to that the listening service is independent and unaffected by the upload
center linkage method. default refers to that the listening service is controlled by the
linkage method of the uploading center. When the type is empty or default, the listening
service is the default.
Request Message
None
Response Message
12.2.1.5 Get the capabilities of listening hosts parameters
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<HttpHostNotificationCap xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, capabilities of subscribing to event types and event channels, attr:version{req, string, protocolVersion}-->
```
<hostNumber>
<!--ro, req, int, the number of listening hosts-->0
</hostNumber>
<urlLen min="1" max="10">
```
<!--ro, req, string, URL length, attr:min{opt, int},max{req, int}-->test
```
</urlLen>
<protocolType opt="HTTP,HTTPS,EHome">
```
<!--ro, req, enum, protocol type, subType:string, attr:opt{req, string}, desc:"HTTP", "HTTPS", "EHome"-->HTTP
```
</protocolType>
<parameterFormatType opt="XML,querystring,JSON">
```
<!--ro, req, enum, alarm parameter format type, subType:string, attr:opt{req, string}, desc:"xml" (XML format), "querystring", "json" (JSON format)--
```
>XML
</parameterFormatType>
<addressingFormatType opt="ipaddress,hostname">
```
<!--ro, req, enum, address format type, subType:string, attr:opt{req, string}, desc:"ipaddress", "hostname"-->ipaddress
```
</addressingFormatType>
<hostName min="1" max="64">
```
<!--ro, opt, string, domain name, attr:min{req, int},max{req, int}, desc:it is valid when addressingFormatType is "hostname"-->test
```
</hostName>
<ipAddress opt="ipv4,ipv6">
```
<!--ro, opt, string, IP address, attr:opt{req, string}, desc:it is valid when addressingFormatType is "ipaddress"-->test
```
</ipAddress>
<portNo min="0" max="10">
```
<!--ro, opt, string, port number, range:[0,65535], attr:min{req, int},max{req, int}-->1
```
</portNo>
<userNameLen min="0" max="10">
```
<!--ro, opt, string, user name length, attr:min{req, int},max{req, int}-->1
```
</userNameLen>
<passwordLen min="0" max="10">
```
<!--ro, opt, string, password length, attr:min{req, int},max{req, int}-->1
```
</passwordLen>
<httpAuthenticationMethod opt="MD5digest,none,base64,basic" def="MD5digest">
```
<!--ro, req, enum, HTTP authentication method, subType:string, attr:opt{req, string},def{opt, string}, desc:"MD5digest"(MD5), "none", "base64"--
```
>MD5digest
</httpAuthenticationMethod>
<SubscribeEventCap>
<!--ro, opt, object, subscribe to changing status of capability set-->
<heartbeat min="0" max="180" def="10">
```
<!--ro, opt, string, heartbeat interval time, attr:min{req, int},max{req, int},def{opt, int}-->1
```
</heartbeat>
<eventMode opt="all,list">
```
<!--ro, opt, enum, event mode, subType:string, attr:opt{req, string}, desc:"all" (subscribe to all channels and events on the device), "list"
```
```
(subscribe to all channels and events on the device)-->all
```
</eventMode>
<EventList>
<!--ro, opt, array, event list, subType:object-->
<Event>
<!--ro, opt, object, event subscription information-->
<type>
<!--ro, req, enum, see details in event type list, subType:string, desc:see details in event type list-->AccessControllerEvent
</type>
<minorAlarm opt="0x400,0x401,0x402,0x403">
```
<!--ro, opt, string, minor alarm type, attr:opt{req, string}, desc:"IDCardInfoEvent" is required when the type of event is
```
"AccessControllerEvent"-->0x400,0x401
</minorAlarm>
<minorException opt="0x400,0x401,0x402,0x403">
```
<!--ro, opt, string, minor exception type, attr:opt{req, string}, desc:"IDCardInfoEvent" is required when the type of event is
```
"AccessControllerEvent"-->0x400,0x401
</minorException>
<minorOperation opt="0x400,0x401,0x402,0x403">
```
<!--ro, opt, string, minor operation type, attr:opt{req, string}, desc:"IDCardInfoEvent" is required when the type of event is
```
"AccessControllerEvent"-->0x400,0x401
</minorOperation>
<minorEvent opt="0x01,0x02,0x03,0x04">
```
<!--ro, opt, string, minor event type, attr:opt{req, string}, desc:"IDCardInfoEvent" is required when the type of event is
```
"AccessControllerEvent"-->0x400,0x401
</minorEvent>
<pictureURLType opt="binary,localURL,cloudStorageURL,EZVIZURL" def="cloudStorageURL">
```
<!--ro, opt, enum, alarm picture format, subType:string, attr:opt{req, string},def{req, string}, desc:"binary", "localURL" (local URL),
```
```
"cloudStorageURL" (cloud storage URL), "EZVIZURL" (EZ URL)-->cloudStorageURL
```
</pictureURLType>
</Event>
</EventList>
</SubscribeEventCap>
</HttpHostNotificationCap>
Request URL
PUT /ISAPI/Event/notification/httpHosts
Query Parameter
None
```
12.2.1.6 Set IP address of receiving server(s)
```
Hikvision co MMC
adil@hikvision.co.az
Request Message
<?xml version="1.0" encoding="UTF-8"?>
<HttpHostNotificationList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--req, array, listening host list, subType:object, attr:version{req, string, protocolVersion}-->
```
<HttpHostNotification>
<!--opt, object, listening host-->
<id>
<!--req, string, ID-->test
</id>
<url>
<!--req, string, URL-->test
</url>
<protocolType>
<!--req, enum, protocol type, subType:string, desc:"HTTP", "HTTPS", "EHome"-->HTTP
</protocolType>
<parameterFormatType>
<!--req, enum, parameter format type, subType:string, desc:"JSON", "XML"-->JSON
</parameterFormatType>
<addressingFormatType>
```
<!--req, enum, address types, subType:string, desc:"hostname" (host name), "ipaddress" (ip address)-->hostname
```
</addressingFormatType>
<hostName>
```
<!--opt, string, host name, dep:and,{$.HttpHostNotification.addressingFormatType,eq,hostName}-->test
```
</hostName>
<ipAddress>
```
<!--opt, string, IPv4 address, dep:or,{$.HttpHostNotification.addressingFormatType,eq,ipAddress}, desc:only one of IPv4 and IPv6 address exists when
```
the address type is "ipaddress"-->test
</ipAddress>
<ipv6Address>
```
<!--opt, string, IPv6 address, dep:or,{$.HttpHostNotification.addressingFormatType,eq,ipAddress}, desc:only one of IPv4 and IPv6 address exists when
```
the address type is "ipaddress"-->test
</ipv6Address>
<portNo>
<!--opt, int, port No.-->1
</portNo>
<userName>
```
<!--opt, string, user name, dep:and,{$.HttpHostNotification.httpAuthenticationMethod,ue,none}-->test
```
</userName>
<password>
```
<!--wo, opt, string, password, dep:and,{$.HttpHostNotification.httpAuthenticationMethod,ue,none}-->test
```
</password>
<httpAuthenticationMethod>
```
<!--req, enum, authentication method, subType:string, desc:"MD5digest" (MD5), "none"-->MD5digest
```
</httpAuthenticationMethod>
<videoUploadEnabled>
<!--opt, bool, whether to upload violation pre-records, desc:when it is enabled, the device will upload the stored video via the "relationVideo"
event-->false
</videoUploadEnabled>
<ANPR>
<!--opt, object, ANPR-->
<detectionUpLoadPicturesType>
<!--opt, enum, uploaded pictures type, subType:string, desc:uploaded pictures type-->all
</detectionUpLoadPicturesType>
</ANPR>
<Extensions>
<!--opt, object, range-->
<intervalBetweenEvents>
<!--opt, int, event interval-->1
</intervalBetweenEvents>
</Extensions>
<uploadImagesDataType>
<!--opt, enum, picture data type, subType:string, desc:picture data type-->URL
</uploadImagesDataType>
<httpBroken>
<!--opt, bool, whether to enable the automatic network replenishment, desc:if the ANR function is enabled, it will be applied to all events-->true
</httpBroken>
<SubscribeEvent>
<!--opt, object, picture uploading modes of all events which contain pictures-->
<heartbeat>
<!--opt, int, heartbeat interval-->30
</heartbeat>
<eventMode>
<!--req, enum, event mode, subType:string, desc:event mode-->all
</eventMode>
<EventList>
<!--opt, array, event list, subType:object-->
<Event>
<!--opt, object, channel information linked to event-->
<type>
<!--req, enum, event type, subType:string, desc:event type-->mixedTargetDetection
</type>
<minorAlarm>
<!--opt, string, minor alarm type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event
is "AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorAlarm>
<minorException>
<!--opt, string, minor exception type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of
event is "AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorException>
<minorOperation>
Hikvision co MMC
adil@hikvision.co.az
<minorOperation>
<!--opt, string, minor operation type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of
event is "AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorOperation>
<minorEvent>
<!--opt, string, minor event type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event
is "AccessControllerEvent"-->0x01,0x02,0x03,0x04
</minorEvent>
<pictureURLType>
```
<!--opt, enum, alarm picture format of the specified event, subType:string, desc:"binary", "localURL" (local URL), "cloudStorageURL" (cloud
```
```
storage URL), "EZVIZURL" (EZ URL)-->binary
```
</pictureURLType>
<channels>
<!--opt, string, channel No., desc:if all channels are being listened to, the node shall not be applied. If some channels are being listened to,
the channel No. shall be listed and separated by commas-->1,2,3,4
</channels>
</Event>
</EventList>
<channels>
<!--opt, string, listen to the specified channel No. list, desc:if all channels are being listened to, the node shall not be applied. If some
channels are being listened to, the channel No. shall be listed and separated by commas-->1,2,3,4
</channels>
<pictureURLType>
```
<!--opt, enum, alarm picture format, subType:string, desc:"binary", "localURL" (local URL), "cloudStorageURL" (cloud storage URL), "EZVIZURL" (EZ
```
```
URL). The node indicates the upload mode of all event pictures. If the node is applied, <pictureURLType> of <Event> will be invalid. If the node is not
```
applied, the pictures are uploaded in the default mode. The default data type of uploaded pictures for front-end devices is binary, and for back-end devices
is local URL of the device-->binary
</pictureURLType>
<ChangedUploadSub>
<!--opt, object, subscribe to messages-->
<interval>
<!--opt, int, the lifecycle of arming GUID, desc:within the interval, if the client software does not reconnect to the device, a new GUID will be
generated by the device-->5
</interval>
<StatusSub>
<!--opt, object, sub status-->
<all>
<!--opt, bool, whether to subscribe to all-->true
</all>
<channel>
```
<!--opt, bool, channel subscription status (whether the channel is subscribed), desc:it is not required if the value of <all> is true-->true
```
</channel>
<hd>
```
<!--opt, bool, HDD subscription status (whether the HDD is subscribed), desc:it is not required if the value of <all> is true-->true
```
</hd>
<capability>
```
<!--opt, bool, subscription status of capability set change (whether the capability set change is subscribed), desc:it is not required if the
```
value of <all> is true-->true
</capability>
</StatusSub>
</ChangedUploadSub>
</SubscribeEvent>
<PackingSpaceRecognition>
<!--opt, object, current control parameters of event listened by parking space detector on the security control panel, desc:related event:
PackingSpaceRecognition-->
<upLoadPicturesType>
<!--req, enum, uploaded picture type, subType:string, desc:uploaded picture type-->all
</upLoadPicturesType>
<PicturesTypes>
<!--opt, array, specified list of uploaded picture types, subType:object, dep:and,
```
{$.HttpHostNotificationList[*].HttpHostNotification.PackingSpaceRecognition.upLoadPicturesType,eq,picturesTypes}-->
```
<picturesType>
```
<!--opt, enum, uploaded picture type, subType:string, desc:"backgroundImage" (captured background picture), "plateImage" (license plate
```
```
thumbnail)-->backgroundImage
```
</picturesType>
</PicturesTypes>
</PackingSpaceRecognition>
<fileUploadType>
<!--opt, enum, subType:string-->cloudStrage
</fileUploadType>
<enabled>
<!--opt, bool, whether to enable-->true
</enabled>
<netWork>
```
<!--opt, enum, network, subType:int, desc:1 (wired network), 2 (mobile network: 3G/4G/5G/GPRS), 3 (wireless network)-->1
```
</netWork>
<method>
<!--opt, enum, request method, subType:string, desc:"POST", "PUT", "GET"-->POST
</method>
<pictureAttachEnabled>
<!--opt, bool, whether to enable attaching pictures, desc:true by default-->true
</pictureAttachEnabled>
<contentType>
```
<!--opt, enum, HTTP content format, subType:string, desc:"multipart" (form format) by default. It is the format for all uploaded events, not limited
```
to pictures only-->multipart
</contentType>
<eventTemplateID>
```
<!--opt, int, event message template ID, desc:related URL (GET /ISAPI/Event/notification/EventTemplateParams?format=json) is to get template list-->1
```
</eventTemplateID>
<customTriggersEnabled>
```
<!--opt, bool, whether to enable custom linkage, desc:true (listening service's linkage method is unaffected by upload center's linkage method, that
```
```
is, independent), false or node doesn't exist (use the previous logic, that upload center sends data to listening service)-->false
```
</customTriggersEnabled>
<checkResponseEnabled>
<!--opt, bool, whether to enable verifying listening host response, desc:when a device uploads an event to the listening host, the host should respond
Hikvision co MMC
adil@hikvision.co.az
<!--opt, bool, whether to enable verifying listening host response, desc:when a device uploads an event to the listening host, the host should respond
with HTTP 200 OK status. Otherwise, the device assumes that the event was not received. However, some platforms' listening services fail to respond. This
parameter is used to address the actual cause. When disabled, the device skips the verification of 200 OK response from the listening host. When enabled,
failure to receive 200 OK indicates the event upload failure, and the device will log the failure or retransmit the event-->true
</checkResponseEnabled>
</HttpHostNotification>
</HttpHostNotificationList>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, opt, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status description, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, which describes the error in details, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
<description>
<!--ro, opt, string, custom error message description, range:[0,1024], desc:detailed information of custom error returned by device applications, used
for fast debugging-->badXmlFormat
</description>
<MErrCode>
<!--ro, opt, string, error codes categorized by functional modules, desc:all general error codes are in the range of this field-->0x00000000
</MErrCode>
<MErrDevSelfEx>
<!--ro, opt, string, error codes categorized by functional modules, desc:none-->0x00000000
</MErrDevSelfEx>
</ResponseStatus>
Request URL
GET /ISAPI/Event/notification/httpHosts
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<HttpHostNotificationList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, array, listening host list, subType:object, attr:version{req, string, protocolVersion}-->
```
<HttpHostNotification>
<!--ro, opt, object, listening host-->
<id>
<!--ro, req, string, subscribe to ID, range:[1,10]-->test
</id>
<url>
<!--ro, req, string, URL-->test
</url>
<protocolType>
```
<!--ro, req, enum, protocol type, subType:string, desc:"HTTP", "HTTPS", "EHome" (ISUP)-->HTTP
```
</protocolType>
<parameterFormatType>
<!--ro, req, enum, parameter format type, subType:string, desc:"JSON", "XML"-->JSON
</parameterFormatType>
<addressingFormatType>
<!--ro, req, enum, address type, subType:string, desc:"hostname", "ipaddress"-->hostname
</addressingFormatType>
<hostName>
```
<!--ro, opt, string, host name, dep:and,{$.HttpHostNotification.addressingFormatType,eq,hostName}-->test
```
</hostName>
<ipAddress>
```
<!--ro, opt, string, IP address, dep:or,{$.HttpHostNotification.addressingFormatType,eq,ipaddress}, desc:only one of IPv4 and IPv6 address exists when
```
the address type is "ipaddress"-->test
</ipAddress>
<ipv6Address>
```
<!--ro, opt, string, IPv6 Address, dep:or,{$.HttpHostNotification.addressingFormatType,eq,ipaddress}, desc:only one of IPv4 and IPv6 address exists
```
12.2.1.7 Get parameters of all listening hosts
Hikvision co MMC
adil@hikvision.co.az
when the address type is "ipaddress"-->test
</ipv6Address>
<portNo>
<!--ro, opt, int, port number-->1
</portNo>
<userName>
```
<!--ro, opt, string, user name, dep:and,{$.HttpHostNotification.httpAuthenticationMethod,eq,MD5digest}-->test
```
</userName>
<httpAuthenticationMethod>
```
<!--ro, req, enum, authentication method, subType:string, desc:"MD5digest"(MD5), "none", "base64"-->MD5digest
```
</httpAuthenticationMethod>
<ANPR>
<!--ro, opt, object, ANPR-->
<detectionUpLoadPicturesType>
```
<!--ro, opt, enum, uploaded pictures type, subType:string, desc:"all", "licensePlatePicture", "detectionPicture"(detected picture)-->all
```
</detectionUpLoadPicturesType>
<videoUploadEnabled>
<!--ro, opt, bool, whether to upload violation pre-records, desc:when it is enabled, the device will upload the stored video via the "relationVideo"
event-->false
</videoUploadEnabled>
</ANPR>
<Extensions>
<!--ro, opt, object, range-->
<intervalBetweenEvents>
<!--ro, opt, int, event interval-->1
</intervalBetweenEvents>
</Extensions>
<uploadImagesDataType>
```
<!--ro, opt, enum, picture data type, subType:string, desc:"URL", "binary" (default value). For cloud storage, only "URL" is supported-->URL
```
</uploadImagesDataType>
<httpBroken>
<!--ro, opt, bool, whether to enable the automatic network replenishment, desc:if the ANR function is enabled, it will be applied to all events-->true
</httpBroken>
<SubscribeEvent>
<!--ro, opt, object, picture uploading modes of all events which contain pictures-->
<heartbeat>
<!--ro, opt, int, heartbeat interval time-->30
</heartbeat>
<eventMode>
```
<!--ro, req, enum, event mode, subType:string, desc:"all" (all alarms need to be reported), "list" (only listed alarms need to be reported)-->all
```
</eventMode>
<EventList>
<!--ro, opt, array, event list, subType:object-->
<Event>
<!--ro, opt, object, channel information linked to event-->
<type>
```
<!--ro, req, enum, event type, subType:string, desc:refer to event type list (eventType): "ADAS"(advanced driving assistance system),
```
```
"ADASAlarm"(advanced driving assistance alarm), "AID"(traffic incident detection), "ANPR"(automatic number plate recognition), "AccessControllerEvent"
```
```
(access controller event), "CDsStatus" (CD burning status), "DBD"(driving behavior detection) "GPSUpload" (GPS information upload), "HFPD"(frequently
```
```
appeared person detection), "IO"(I/O alarm), "IOTD" (IoT device detection), "LES" (logistics scanning event), "LFPD"(rarely appeared person detection),
```
```
"PALMismatch" (video standard mismatch), "PIR", "PeopleCounting" (people counting), "PeopleNumChange" (people number change detection), "Standup"(standing
```
```
up detection), "TMA"(thermometry alarm), "TMPA"(temperature measurement pre-alarm), "VMD"(motion detection), "abnormalAcceleration", "abnormalDriving",
```
```
"advReachHeight", "alarmResult", "attendance", "attendedBaggage", "audioAbnormal", "audioexception", "behaviorResult"(abnormal event detection),
```
```
"blindSpotDetection"(blind spot detection alarm), "cardMatch", "changedStatus", "collision", "containerDetection", "crowdSituationAnalysis",
```
```
"databaseException", "defocus"(defocus detection), "diskUnformat"(disk unformatted), "diskerror", "diskfull", "driverConditionMonitor"(driver status
```
```
monitoring alarm); "emergencyAlarm", "faceCapture", "faceSnapModeling", "facedetection", "failDown"(People Falling Down), "faultAlarm", "fielddetection"
```
```
(intrusion detection), "fireDetection", "fireEscapeDetection", "flowOverrun", "framesPeopleCounting", "getUp"(getting up detection), "group" (people
```
```
gathering), "hdBadBlock"(HDD bad sector detection event), "hdImpact"(HDD impact detection event), "heatmap"(heat map alarm), "highHDTemperature"(HDD high
```
```
temperature detection event), "highTempAlarm"(HDD high temperature alarm), "hotSpare"(hot spare exception), "illaccess"(invalid access),
```
```
"ipcTransferAbnormal", "ipconflict"(IP address conflicts), "keyPersonGetUp"(key person getting up detection), "leavePosition"(absence detection),
```
```
"linedetection"(line crossing detection), "listSyncException"(list synchronization exception), "loitering"(loitering detection), "lowHDTemperature"(HDD low
```
```
temperature detection event), "mixedTargetDetection"(multi-target-type detection), "modelError", "nicbroken"(network disconnected), "nodeOffline"(node
```
```
disconnected), "nonPoliceIntrusion", "overSpeed"(overspeed alarm), "overtimeTarry"(staying overtime detection), "parking"(parking detection),
```
```
"peopleNumChange", "peopleNumCounting", "personAbnormalAlarm"(person ID exception alarm), "personDensityDetection", "personQueueCounting",
```
```
"personQueueDetection", "personQueueRealTime"(real-time data of people queuing-up detection), "personQueueTime"(waiting time detection), "playCellphone"
```
```
(playing mobile phone detection), "pocException"(video exception), "poe"(POE power exception), "policeAbsent", "radarAlarm", "radarFieldDetection",
```
```
"radarLineDetection", "radarPerimeterRule"(radar rule data), "radarTargetDetection", "radarVideoDetection"(radar-assisted target detection),
```
```
"raidException", "rapidMove", "reachHeight"(climbing detection), "recordCycleAbnormal"(insufficient recording period), "recordException", "regionEntrance",
```
```
"regionExiting", "retention"(people overstay detection), "rollover", "running"(people running), "safetyHelmetDetection"(hard hat detection),
```
```
"scenechangedetection", "sensorAlarm"(angular acceleration alarm), "severeHDFailure"(HDD major fault detection), "shelteralarm"(video tampering alarm),
```
```
"shipsDetection", "sitQuietly"(sitting detection), "smokeAndFireDetection", "smokeDetection", "softIO", "spacingChange"(distance exception), "sysStorFull"
```
```
(storaging full alarm of cluster system), "takingElevatorDetection"(elevator electric moped detection), "targetCapture", "temperature"(temperature
```
```
difference alarm), "thermometry"(temperature alarm), "thirdPartyException", "toiletTarry"(in-toilet overtime detection), "tollCodeInfo"(QR code information
```
```
report), "tossing"(thrown object detection), "unattendedBaggage", "vehicleMatchResult"(uploading list alarms), "vehicleRcogResult", "versionAbnormal"
```
```
(cluster version exception), "videoException", "videoloss", "violationAlarm", "violentMotion"(violent motion detection), "yardTarry"(playground overstay
```
```
detection), "AccessControllerEvent", "IDCardInfoEvent", "FaceTemperatureMeasurementEvent", "QRCodeEvent"(QR code event of access control),
```
```
"CertificateCaptureEvent"(person ID capture comparison event), "UncertificateCompareEvent", "ConsumptionAndTransactionRecordEvent", "ConsumptionEvent",
```
```
"TransactionRecordEvent", "SetMealQuery"(searching consumption set meals), "ConsumptionStatusQuery"(searching the consumption status), "humanBodyComparison"
```
```
(human body comparison), "regionTargetNumberCounting" (regional target statistics)-->mixedTargetDetection
```
</type>
<minorAlarm>
<!--ro, opt, string, alarm sub type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event
is "AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorAlarm>
<minorException>
<!--ro, opt, string, exception sub type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of
event is "AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorException>
<minorOperation>
<!--ro, opt, string, operation sub type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of
event is "AccessControllerEvent"-->0x400,0x401,0x402,0x403
</minorOperation>
<minorEvent>
<!--ro, opt, string, event sub type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event
Hikvision co MMC
adil@hikvision.co.az
<!--ro, opt, string, event sub type, desc:refer to the macro definition of uploaded events. "IDCardInfoEvent" is required when the type of event
is "AccessControllerEvent"-->0x01,0x02,0x03,0x04
</minorEvent>
<pictureURLType>
<!--ro, opt, enum, alarm picture format of the specified event, subType:string, desc:alarm picture format of the specified event-->binary
</pictureURLType>
<channels>
<!--ro, opt, string, listen to the events on the specified channel No. list, desc:if all channels are being listened to, the node shall not be
applied. if some channels are being listened to, the channel No. shall be listed and separated by commas-->1,2,3,4
</channels>
</Event>
</EventList>
<channels>
<!--ro, opt, string, listen to the specified channel No. list, desc:if all channels are being listened to, the node shall not be applied. if some
channels are being listened to, the channel No. shall be listed and separated by commas-->1,2,3,4
</channels>
<pictureURLType>
<!--ro, opt, enum, alarm picture format, subType:string, desc:the node indicates the picture types of all events which contain pictures to be
uploaded. if the node is applied, the pictureURLType of the Event will not take effect. if the node is not applied, the pictures reported from the device by
default mode: the default data type of uploaded pictures captured from front-end devices is binary. the default data type of uploaded pictures reported from
storage devices is local URL of the device.-->binary
</pictureURLType>
<ChangedUploadSub>
<!--ro, opt, object, subscribe to messages-->
<interval>
<!--ro, opt, int, the lifecycle of arming GUID, desc:if GUID is not reconnected in the internal, a new GUID will be generated since the device
start a new arm period-->5
</interval>
<StatusSub>
<!--ro, opt, object, sub status-->
<all>
<!--ro, opt, bool, subscribe to all?-->true
</all>
<channel>
<!--ro, opt, bool, subscribe to channel status, desc:reporting is not required if all is true-->true
</channel>
<hd>
<!--ro, opt, bool, subscribe to HDD status, desc:reporting is not required if all is true-->true
</hd>
<capability>
<!--ro, opt, bool, subscribe to changing status of capability set, desc:reporting is not required if all is true-->true
</capability>
</StatusSub>
</ChangedUploadSub>
</SubscribeEvent>
<PackingSpaceRecognition>
<!--ro, opt, object, current control parameters of event listened by parking space detector on the security control panel, desc:related event:
PackingSpaceRecognition-->
<upLoadPicturesType>
```
<!--ro, opt, enum, uploaded picture type, subType:string, desc:"all", "picturesTypes" (upload specified types of pictures), "notUpload" (not upload
```
```
pictures)-->all
```
</upLoadPicturesType>
<PicturesTypes>
<!--ro, opt, array, specified list of uploaded picture type, subType:object, dep:and,
```
{$.HttpHostNotificationList[*].HttpHostNotification.PackingSpaceRecognition.upLoadPicturesType,eq,picturesTypes}-->
```
<picturesType>
```
<!--ro, opt, enum, uploaded picture type, subType:string, desc:"backgroundImage" (captured background picture), "plateImage" (license plate
```
```
thumbnail)-->backgroundImage
```
</picturesType>
</PicturesTypes>
</PackingSpaceRecognition>
<fileUploadType>
<!--ro, opt, enum, subType:string-->cloudStrage
</fileUploadType>
<enabled>
<!--ro, opt, bool, whether to enable-->true
</enabled>
<netWork>
```
<!--ro, opt, enum, network, subType:int, desc:1 (wired network), 2 (mobile network: 3G/4G/5G/GPRS), 3 (wireless network)-->1
```
</netWork>
<method>
<!--ro, opt, enum, request method, subType:string, desc:"POST", "PUT", "GET"-->POST
</method>
<pictureAttachEnabled>
<!--ro, opt, bool, whether to enable attaching pictures, desc:true by default-->true
</pictureAttachEnabled>
<contentType>
```
<!--ro, opt, enum, HTTP content format, subType:string, desc:"multipart" (form format) by default. It is the format for all uploaded events, not
```
limited to pictures only-->multipart
</contentType>
<eventTemplateID>
```
<!--ro, opt, int, event message template ID, desc:related URL (GET /ISAPI/Event/notification/EventTemplateParams?format=json) is to get template list-
```
->1
</eventTemplateID>
<customTriggersEnabled>
```
<!--ro, opt, bool, whether to enable custom linkage, desc:true (listening service's linkage method is unaffected by upload center's linkage method,
```
```
that is, independent), false or node doesn't exist (use the previous logic, that upload center sends data to listening service)-->false
```
</customTriggersEnabled>
<checkResponseEnabled>
<!--ro, opt, bool, whether to enable verifying listening host response, desc:when a device uploads an event to the listening host, the host should
respond with HTTP 200 OK status. Otherwise, the device assumes that the event was not received. However, some platforms' listening services fail to respond.
This parameter is used to address the actual cause. When disabled, the device skips the verification of 200 OK response from the listening host. When
enabled, failure to receive 200 OK indicates the event upload failure, and the device will log the failure or retransmit the event-->true
</checkResponseEnabled>
Hikvision co MMC
adil@hikvision.co.az
</HttpHostNotification>
</HttpHostNotificationList>
Request URL
GET /ISAPI/Intelligent/FDLib/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, request URL*/
"statusCode": 1,
/*ro, req, int, status code*/
"statusString": "test",
/*ro, req, string, status description*/
"subStatusCode": "test",
/*ro, req, string, sub status code*/
"errorCode": 1,
/*ro, opt, int, error code, this field is required when the value of statusCode is not 1, and it corresponds to subStatusCode*/
"errorMsg": "ok",
/*ro, opt, string, detailed error description, this field is required when the value of statusCode is not 1*/
"FDNameMaxLen": 64,
/*ro, req, int, maximum length of face picture library name*/
"customInfoMaxLen": 192,
/*ro, req, int, maximum length of custom information*/
"FDMaxNum": 3,
/*ro, req, int, maximum number of face picture libraries*/
"FDRecordDataMaxNum": 12345,
/*ro, req, int, maximum face records supported by face picture library*/
"supportFDFunction": "post,delete,put,get,setUp",
```
/*ro, req, string, the supported operations on face picture library, desc:"post” (create), "delete” (delete), "put” (edit), "get” (search), "setUp”
```
```
(set)*/
```
"isSuportFDSearch": true,
/*ro, req, bool, whether supports searching in face picture library, desc:whether supports searching in face picture library*/
```
"isDisplayCaptureNum": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
"isSupportFDSearchDataPackage": true,
/*ro, req, bool, whether supports packaging the found data in the face picture library*/
"isSuportFSsearchByPic": true,
/*ro, req, bool, whether supports searching by picture in the face picture library, desc:whether supports searching by picture in the face picture
library*/
"isSuportFSsearchByPicGenerate": true,
/*ro, req, bool, whether supports exporting results of using picture to search picture from the face picture library*/
"isSuportFDSearchDuplicate": true,
/*ro, req, bool, whether supports duplication checking*/
"isSuportFDSearchDuplicateGenerate": true,
/*ro, req, bool, whether supports exporting the duplication checking results*/
"isSuportFCSearch": true,
/*ro, req, bool, whether supports searching face picture comparison alarms*/
"isSupportFCSearchDataPackage": true,
/*ro, req, bool, whether supports packaging the search results of face picture comparison alarms*/
"isSupportFDExecuteControl": true,
/*ro, req, bool, whether supports creating relation between face picture libraries and cameras*/
"generateMaxNum": 1234,
/*ro, opt, int, maximum face records can be exported from face picture library*/
"faceLibType": "blackFD,staticFD,infraredFD",
/*ro, opt, string, face picture library type*/
"modelMaxNum": 1000,
/*ro, opt, int, the maximum number of search results*/
"isSupportModelData": true,
/*ro, opt, bool, whether it supports applying model data*/
"isSuportFDLibArmingType": true,
/*ro, opt, bool, whether it supports face picture library arming type*/
"isSuportFDLibSearch": true,
/*ro, opt, bool, whether it supports searching face picture library*/
"FDArmingRecordDataMaxNum": 12345,
/*ro, opt, int, the supported maximum number of face records in the face picture arming library*/
"isSupportControlPersonRecordByHumanId": true,
12.3 Video Recognition
```
12.3.1 Face Picture Library Management (To be Optimized)
```
12.3.1.1 Get face picture library capability
Hikvision co MMC
adil@hikvision.co.az
/*ro, opt, bool, whether it supports modifying and deleting the face record by humanId*/
"isSupportControlPersonRecordByRowKey": true,
/*ro, opt, bool, whether it supports modifying and deleting the face record by rowKey*/
"isSupportFaceLibRebuildCfg": true,
/*ro, opt, bool, whether it supports recreating face picture library information and configuration*/
"isSupportFDMove": true,
/*ro, opt, bool, whether it supports moving face data in the face picture library in a batch, desc:the related URI is
/ISAPI/Intelligent/FDLib/FDMove/capabilities?format=json*/
"faceURLLen": 1024,
/*ro, opt, int, the maximum size of the face picture URL, desc:if this node is not returned, the default size of the face picture URL supported by the
```
device is 256 bytes; otherwise, the device should support that the value of this node is greater than or equal to 256*/
```
"isSupportArmingLibCfg": true,
/*ro, opt, bool, whether it supports configuring parameters of the armed face picture library, desc:related URI:
/ISAPI/Intelligent/FDLib/armingLibCfg/capabilities?format=json*/
"isSupportModelTransformation": true,
/*ro, opt, bool, whether it supports converting face picture models in the face picture list library, desc:related URI:
/ISAPI/Intelligent/FDLib/model/transformation/capabilities?format=json*/
"featurePointTypeList": ["face", "leftEye", "rightEye", "leftMouthCorner", "rightMouthCorner", "nose"],
/*ro, opt, array, feature point types of face pictures supported by the device, subType:string*/
"isSupportPresort": true,
/*ro, opt, bool, whether it supports configuring pre-categorization, desc:related URI: /ISAPI/Intelligent/FDLib/presort/capabilities?format=json*/
```
"libAttribute": {
```
```
/*ro, opt, object, library attribute type, desc:"general" (normal library), "blockList" (blocklist library), "VIP" (VIP library), "passerby" (allowlist
```
```
library, which cannot be deleted)*/
```
"@opt": ["general", "blackList", "VIP", "passerby"]
/*ro, opt, array, options, subType:string*/
```
},
```
```
"faceType": {
```
/*ro, opt, object, face picture type*/
"@opt": ["normalFace", "patrolFace", "hijackFace", "superFace"]
/*ro, opt, array, options, subType:string*/
```
},
```
```
"saveFacePic": {
```
/*ro, opt, object, whether to save the registered face picture*/
"@opt": [true, false]
/*ro, opt, array, options, subType:bool*/
```
},
```
```
"leaderPermission": {
```
/*ro, opt, object, first authentication permission*/
"@size": 4,
/*ro, opt, int, the maximum number of array members, range:[1,4]*/
"@min": 1,
/*ro, opt, int, member value range, range:[1,4]*/
"@max": 4
/*ro, opt, int, member value range, range:[1,4]*/
```
},
```
```
"facePicFormat": {
```
/*ro, opt, object*/
"@opt": ["jpg", "png", "bmp"]
/*ro, req, array, subType:string*/
```
}
```
```
}
```
Request URL
DELETE /ISAPI/Intelligent/FDLib?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:it is required when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this field is required when the value of statusCode is not 1*/
```
}
```
Request URL
12.3.1.2 Delete all face picture libraries
12.3.1.3 Create a face picture library
Hikvision co MMC
adil@hikvision.co.az
POST /ISAPI/Intelligent/FDLib?format=json
Query Parameter
None
Request Message
```
{
```
"faceLibType": "blackFD,staticFD",
/*req, string, face picture library type, desc:face picture library type*/
"name": "test",
/*req, string, name of the face picture library, range:[0,48], desc:name of the face picture library*/
"customInfo": "test",
/*opt, string, custom information, range:[0,192], desc:custom information*/
"libArmingType": "armingLib",
/*opt, enum, subType:string*/
"libAttribute": "blackList",
/*opt, enum, subType:string*/
"FDID": "test"
/*opt, string, face picture library ID, desc:face picture library ID*/
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, request URL*/
"statusCode": 1,
```
/*ro, req, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, req, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, req, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok",
/*ro, opt, string, error details, desc:this node is required when the value of statusCode is not 1*/
"FDID": "test"
/*ro, opt, string, face picture library ID, desc:face picture library ID*/
```
}
```
Request URL
DELETE /ISAPI/Intelligent/FDLib?format=json&FDID=<FDID>&faceLibType=<faceLibType>&terminalNo=
<terminalNo>
Query Parameter
Parameter Name Parameter Type Description
FDID string --
```
faceLibType string "blackFD” (list library), "staticFD” (static library)
```
terminalNo string Terminal No. It is an integer starting from 1.
Request Message
None
Response Message
12.3.1.4 Delete a specified face picture library
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "OK",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:it is required when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok",
/*ro, opt, string, error information, desc:this field is required when the value of statusCode is not 1*/
"MErrCode": "0x00000000",
/*ro, opt, string*/
"MErrDevSelfEx": "0x00000000"
/*ro, opt, string*/
```
}
```
Request URL
PUT /ISAPI/Intelligent/FDLib?format=json&FDID=<FDID>&faceLibType=<faceLibType>&terminalNo=<terminalNo>
Query Parameter
Parameter Name Parameter Type Description
FDID string --
faceLibType string --
terminalNo string --
Request Message
```
{
```
"name": "test",
/*opt, string, face picture library name, range:[0,48]*/
"customInfo": "test",
/*opt, string, custom information, range:[0,192]*/
"libArmingType": "armingLib",
```
/*opt, enum, arming type of the list library, subType:string, desc:“armingLib” (armed face picture library), “nonArmingLib” (not armed face picture
```
```
library). The default value is "armingLib”*/
```
"libAttribute": "blackList"
```
/*opt, enum, library type, subType:string, desc:“blackList” (blocklist library), “VIP” (VIP library), “passerby” (passerby library). The passerby
```
library cannot be deleted*/
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:it corresponds to subStatusCode when statusCode is not 1*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this field is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/Intelligent/FDLib?format=json&FDID=<FDID>&faceLibType=<faceLibType>&terminalNo=<terminalNo>
Query Parameter
12.3.1.5 Edit the information of a specific face picture library information, including name and custom
information
12.3.1.6 Get the information, including library ID, library type, name, and custom information, of all face
picture libraries
Hikvision co MMC
adil@hikvision.co.az
Parameter
Name
Parameter
Type Description
FDID string --
```
faceLibType string "blackFD” (list library), "staticFD” (static library), "infraredFD" (IR face picturelibrary)
```
terminalNo string Terminal No. It is an integer starting from 1.
Request Message
None
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, request URL*/
"statusCode": 1,
/*ro, req, int, status code, desc:status code*/
"statusString": "OK",
/*ro, req, string, status description, range:[1,64], desc:status description*/
"subStatusCode": "ok",
/*ro, req, string, sub status code, range:[1,64], desc:sub status code*/
"errorCode": 1,
/*ro, opt, int*/
"errorMsg": "ok",
/*ro, opt, string, error description, desc:error description*/
"faceLibType": "blackFD",
```
/*ro, opt, enum, face picture library type, subType:string, desc:"blackFD” (list library), "staticFD” (static library)*/
```
"name": "test",
/*ro, opt, string, face picture library name, range:[1,48]*/
"customInfo": "test",
/*ro, opt, string, custom information, range:[0,192]*/
"libArmingType": "armingLib",
/*ro, opt, enum, library arming type, subType:string, desc:library arming type*/
"libAttribute": "blackList",
/*ro, opt, enum, subType:string*/
"personnelFileEnabled": true
/*ro, opt, bool*/
```
}
```
Request URL
GET /ISAPI/Intelligent/FDLib/Count?format=json
Query Parameter
None
Request Message
None
Response Message
12.3.2 Face Picture Library Record Management
12.3.2.1 Get the total number of face records in all face picture libraries
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"requestURL": "http://10.7.52.31:8080/kms/services/rest/dataInfoService/downloadFile",
/*ro, opt, string, request URL*/
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, req, int, error code, desc:it is required when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok",
/*ro, req, string, see the description of this node and above nodes in the message of JSON_ResponseStatus, desc:this node is required when the value of
statusCode is not 1*/
"FDRecordDataInfo": [
/*ro, opt, array, information of face records in face picture library, subType:object, desc:this node is valid when errorCode is 1 and errorMsg is
"ok"*/
```
{
```
"FDID": "test",
/*ro, opt, string, face picture library ID, desc:the maximum size is 63 bytes*/
"faceLibType": "blackFD",
/*ro, opt, enum, face picture library type, subType:string, desc:face picture library type "blackFD" list library,"staticFD" static library, the
maximum size is 32 bytes*/
"name": "test",
/*ro, opt, string, face picture library name, desc:the maximum size is 48 bytes*/
"recordDataNumber": 123,
/*ro, opt, int, number of records*/
"libArmingType": "armingLib",
/*ro, opt, enum, arming type, subType:string, desc:arming type*/
"libAttribute": "general",
/*ro, opt, enum, subType:string*/
"personnelFileEnabled": true
/*ro, opt, bool*/
```
}
```
],
"totalRecordDataNumber": 500000,
/*ro, opt, int, total number of records, desc:total number of records*/
```
"FDCapacity": {
```
/*ro, opt, object*/
"total": 0.000,
/*ro, req, float*/
"use": 0.000,
/*ro, req, float*/
"remain": 0.000,
/*ro, req, float, remaining space, desc:remaining space*/
"maxRecordDataNumber": 0,
/*ro, opt, int*/
"useRecordDataNumber": 0,
/*ro, opt, int*/
"remainRecordDataNumber": 0
/*ro, opt, int*/
```
}
```
```
}
```
Request URL
GET /ISAPI/Intelligent/FDLib/Count?format=json&FDID=<FDID>&faceLibType=<faceLibType>&terminalNo=
<terminalNo>
Query Parameter
Parameter
Name
Parameter
Type Description
FDID string --
```
faceLibType string "blackFD” (list library), "staticFD” (static library), "infraredFD" (IR face picturelibrary)
```
terminalNo string --
Request Message
None
Response Message
12.3.2.2 Get the total number of face records in a face picture library
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"requestURL": "test",
/*ro, opt, string, request URL*/
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "OK",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:it is required when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok",
/*ro, opt, string, error description, desc:this node is required when the value of statusCode is not 1*/
"FDID": "test",
/*ro, opt, string, face picture library ID, range:[1,64]*/
"faceLibType": "blackFD",
/*ro, opt, enum, face picture library type, subType:string, desc:face picture library type*/
"name": "test",
/*ro, opt, string, name of the face picture library, desc:the maximum length is 48*/
"recordDataNumber": 123
/*ro, opt, int, total number of records*/
```
}
```
Request URL
POST /ISAPI/Intelligent/FDLib/FaceDataRecord?format=json
Query Parameter
None
Request Message
12.3.2.3 Add a face record to the face picture library
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"faceURL": "test",
/*opt, string, picture storage URL inputted when uploading the face picture by URL, desc:select this field or modelData*/
"faceLibType": "blackFD",
/*req, enum, face picture library type, subType:string, desc:face picture library type*/
"FDID": "test",
/*req, string, face picture library ID, range:[1,64]*/
"FPID": " test",
/*opt, string, face record ID, range:[1,1000], desc:face record ID,it can be generated by device or inputted. If it is inputted,it should be the unique
```
ID with the combination of letters and digits,and the maximum length is 63 bytes; if it is generated by the device automatically,it is the same as the
```
```
employee No. (person ID)*/
```
"name": "张三",
/*req, string, name of person in the face picture, range:[1,1000], desc:the maximum size is 96 bytes*/
"gender": "male",
```
/*opt, enum, gender of person in the face picture, subType:string, desc:“male”, “female”, “unknown”; the maximum size is 32 bytes*/
```
"bornTime": "2004-05-03",
/*req, string, birthday of person in the face picture, desc:the maximum size is 20 bytes*/
"city": "130100",
/*opt, string, city code of birth for the person in the face picture, desc:the maximum size is 32 bytes*/
"certificateType": "ID",
```
/*opt, enum, certificate type, subType:string, desc:"ID" (ID card), "officerID" (military officer ID), "other" (other type), "LawyerCertificate" (lawyer
```
```
qualification), "birthCertificate", "householdRegister", "judgeCertificate", "studentIDCard", "workCard" (work permit), "policeID",
```
"foreignPermanentResidentIDCard", "passport", "pressCard", "prosecutorCard", "temporaryIDCard", "temporaryResidencePermit"*/
"certificateNumber": "test",
/*opt, string, certificate No., range:[1,64], desc:the maximum size is 32 bytes*/
"caseInfo": "test",
```
/*opt, string, case information, desc:the maximum size is 192 bytes; it is valid when faceLibType is "blackFD”*/
```
"tag": "aa,bb,cc,dd",
/*opt, string, custom tag, desc:up to 4 tags, which are separated by commas. The maximum size is 195 bytes. It is valid when faceLibType is "blackFD”*/
"address": "test",
/*opt, string, person address, desc:the maximum size is 192 bytes. It is valid when faceLibType is "staticFD”*/
"customInfo": "test",
/*opt, string, custom information, desc:the maximum size is 192 bytes. It is valid when faceLibType is "staticFD"*/
"modelData": "test",
/*opt, string, target modeling data, desc:target model data,non-modeled binary data needs to be encrypted by Base64 during transmission*/
"transfer": true,
/*opt, bool, whether to enable transfer, desc:whether to enable transfer*/
"operateType": "byTerminal",
```
/*opt, enum, operation type, subType:string, desc:"byTerminal” (operate by terminal)*/
```
"terminalNoList": [1],
```
/*opt, array, terminal ID list, subType:int, desc:this node is required when operation type is "byTerminal"; currently, only one terminal is supported*/
```
"PicFeaturePoints": [
/*opt, array, feature points to be applied, subType:object*/
```
{
```
"featurePointType": "face",
```
/*req, enum, feature point type, subType:string, desc:"face", "leftEye" (left eye), "rightEye" (right eye), "leftMouthCorner" (left corner of
```
```
mouth), "rightMouthCorner" (right corner of mouth), "nose"*/
```
```
"coordinatePoint": {
```
/*opt, object, coordinates of the feature point, desc:object,coordinates of the feature point*/
"x": 1,
/*req, int, X-coordinate, range:[0,1000], desc:normalized X-coordinate which is between 0 and 1000*/
"y": 1,
/*req, int, Y-coordinate, range:[0,1000], desc:normalized Y-coordinate which is between 0 and 1000*/
"width": 1,
/*opt, int, width, range:[0,1000], desc:this node is required when featurePointType is "face"*/
"height": 1
/*opt, int, height, range:[0,1000], desc:this node is required when featurePointType is "face"*/
```
}
```
```
}
```
],
```
"cutOutRect": {
```
/*opt, object, picture cropping frame, desc:the origin is the upper-left corner of the screen, which is used for the target frame in matting*/
"x": 0.000,
/*req, float, x-coordinate, range:[0,1], desc:normalize coordinate*/
"y": 0.000,
/*req, float, y-Coordinate, range:[0,1], desc:normalize coordinate*/
"width": 0.000,
/*req, float, width, range:[0,1]*/
"height": 0.000
/*req, float, height, range:[0,1]*/
```
},
```
"faceType": "normalFace",
```
/*opt, enum, face picture type, subType:string, desc:"normalFace" (normal face, default value), "patrolFace" (patrol person face), "hijackFace" (duress
```
```
person face), "superFace" (super person face)*/
```
"saveFacePic": true,
/*opt, bool, whether to save face pictures*/
"leaderPermission": [1, 2, 3, 4]
/*opt, array, first authentication permission, subType:int, range:[1,4], desc:if the array is empty, it indicates clearing first authentication
```
permission of the person; if not, it indicates that the person have first authentication permission for the door 1, 2, 3, and 4*/
```
```
}
```
```
Parameter Name Parameter Value Parameter Type(Content-Type) Content-ID File Name Description
```
faceURL [Message content] application/json -- -- --
img [Binary picture data] image/jpeg facePic.jpg --
Hikvision co MMC
adil@hikvision.co.az
Note： The protocol is transmitted in form format. See Chapter 4.5.1.4 for form framework description, as shown in
the instance below.
--<frontier>
```
Content-Disposition: form-data; name=Parameter Name;filename=File Name
```
Content-Type: Parameter Type
Content-Length: ****
Content-ID: Content ID
Parameter Value
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, request URL*/
"statusCode": 1,
/*ro, req, int, status code*/
"statusString": "test",
/*ro, req, string, status description*/
"subStatusCode": "test",
/*ro, req, string, sub status code*/
"errorCode": 1,
/*ro, opt, int, error code, desc:this field is required when the value of statusCode is not 1*/
"errorMsg": "ok",
/*ro, opt, string, error description, desc:see the description of this node and above nodes in the message of JSON_ResponseStatus*/
"FPID": "test",
/*ro, opt, string, face record ID, range:[1,64], desc:face record ID returned when the face record is added,it is unique,and the maximum size is 63
bytes. This node is valid when errorCode is "1" and errorMsg is "ok"*/
"rowKey": "test"
/*ro, opt, string, rowKey of face record, desc:rowKey of face record is returned after face data is added. It is unique and in string format. The
maximum length is 64 bytes.*/
```
}
```
Request URL
PUT /ISAPI/Intelligent/FDLib/FDModify?format=json
Query Parameter
None
Request Message
```
Parameter Name: the name property of Content-Disposition in the header of form unit; it refers to the form unit
```
name.
```
Parameter Type (Content-Type): the Content-Type property in the header of form unit.
```
```
File Name (filename): the filename property of Content-Disposition of form unit Headers. It exists only when the
```
transmitted data of form unit is file, and it refers to the file name of form unit body.
Parameter Value: the body content of form unit.
12.3.2.4 Edit face records in the face picture library in a batch
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"faceURL": "test",
/*opt, string, picture storage URL inputted when uploading the face picture by URL, the maximum length is 256 bytes*/
"faceLibType": "blackFD",
/*req, enum, face picture library type, subType:string, desc:face picture library type: "blackFD"-list library,"staticFD"-static library,the maximum
length is 32 bytes*/
"FDID": "test",
/*req, string, face picture library ID, desc:face picture library ID,the maximum length is 63 bytes,multiple face picture libraries should be separated
by commas*/
"FPID": " ",
/*opt, string, face record ID*/
"name": "test",
/*opt, string, name*/
"gender": "any",
```
/*req, enum, gender, subType:string, desc:"any” (unlimited condition which is used in search), "male”, “female”, “unknown"*/
```
"bornTime": "2004-05-03",
/*req, time, date of birth of the person in the face picture in ISO8601 time format, the maximum length is 20 bytes, desc:date of birth of the person in
the face picture in ISO8601 time format,the maximum length is 20 bytes*/
"city": "130100",
/*opt, string, code of the city of birth for the person in the face picture, the maximum length is 32 bytes, desc:code of the city of birth for the
person in the face picture,the maximum length is 32 bytes*/
"certificateType": "ID",
/*req, enum, certificate type, subType:string*/
"certificateNumber": "test",
/*opt, string, ID No., the maximum length is 32 bytes*/
"caseInfo": "test",
/*opt, string, case information, it is valid when faceLibType is "blackFD”, range:[0,192]*/
"tag": "aa,bb,cc,dd",
/*opt, string, custom tag*/
"address": "test",
/*opt, string, person address, it is valid when faceLibType is "staticFD”*/
"customInfo": "test",
/*opt, string, custom information, it is valid when faceLibType is "staticFD”*/
"modelData": "test",
/*opt, string, target model data, non-modeled binary data needs to be encrypted by base64 during transmission*/
"operateType": "byTerminal",
/*opt, enum, operation type, subType:string, desc:"byTerminal"-by terminal*/
"terminalNoList": [1],
```
/*opt, array, terminal ID list, subType:int, desc:this node is required when operation type is "byTerminal"; currently, only one terminal is supported*/
```
"PicFeaturePoints": [
/*opt, array, feature points to be applied. If the device only supports three types of feature points, when the platform applies more than three types
of feature points,the device will not return error information, subType:object*/
```
{
```
"featurePointType": "face",
```
/*req, enum, feature point type, subType:string, desc:"face", "leftEye" (left eye), "rightEye" (right eye), "leftMouthCorner" (left corner of
```
```
mouth), "rightMouthCorner" (right corner of mouth), "nose”*/
```
```
"coordinatePoint": {
```
/*opt, object, point coordinates*/
"x": 1,
/*req, int, X-coordinate, range:[0,1000], desc:normalized X-coordinate which is between 0 and 1000*/
"y": 1,
/*req, int, Y-coordinate, range:[0,1000], desc:normalized Y-coordinate which is between 0 and 1000*/
"width": 1,
/*opt, int, width, range:[0,1000], desc:width which is between 0 and 1000. This node is required when featurePointType is "face"*/
"height": 1
/*opt, int, height, range:[0,1000], desc:height which is between 0 and 1000. This node is required when featurePointType is "face"*/
```
}
```
```
}
```
],
"faceType": "normalFace",
/*opt, enum, face picture type, subType:string*/
"saveFacePic": true,
/*opt, bool, whether to save face pictures*/
"leaderPermission": [1, 2, 3, 4]
/*opt, array, subType:int, range:[1,4]*/
```
}
```
Parameter
Name Parameter Value
```
Parameter Type(Content-
```
```
Type)
```
Content-
ID File Name Description
faceURL [Message content] application/json -- -- --
img [Binary picturedata] image/jpeg faceImage.jpg --
Note： The protocol is transmitted in form format. See Chapter 4.5.1.4 for form framework description, as shown in
the instance below.
Hikvision co MMC
adil@hikvision.co.az
--<frontier>
```
Content-Disposition: form-data; name=Parameter Name;filename=File Name
```
Content-Type: Parameter Type
Content-Length: ****
Content-ID: Content ID
Parameter Value
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error details, desc:this field is required when statusCode is not 1*/
```
}
```
Request URL
PUT /ISAPI/Intelligent/FDLib/FDSearch/Delete?format=json&FDID=<FDID>&faceLibType=<FDType>
Query Parameter
Parameter
Name
Parameter
Type Description
FDID string Face picture library ID, and the maximum length is 64 bytes. Create a face picture library:POST /ISAPI/Intelligent/FDLib?format=json, and it is returned for success.
```
FDType enum Face picture library type: "blackFD” (list library), "staticFD” (static library)
```
Request Message
```
{
```
"FPID": [
/*req, array, list of face record ID, subType:object, desc:list of face record ID*/
```
{
```
"value": "test",
/*req, string, face record ID, range:[0,64]*/
"rowKey": "test"
/*opt, string, main key of face picture library, range:[0,64], desc:main key of face picture library*/
```
}
```
],
"operateType": "byTerminal",
```
/*opt, enum, operation type, subType:string, desc:"byTerminal" (by terminal)*/
```
"terminalNoList": [1]
/*opt, array, terminal ID list, subType:int, desc:terminal ID list*/
```
}
```
Response Message
```
Parameter Name: the name property of Content-Disposition in the header of form unit; it refers to the form unit
```
name.
```
Parameter Type (Content-Type): the Content-Type property in the header of form unit.
```
```
File Name (filename): the filename property of Content-Disposition of form unit Headers. It exists only when the
```
transmitted data of form unit is file, and it refers to the file name of form unit body.
Parameter Value: the body content of form unit.
```
12.3.2.5 Delete the face record(s) in the face picture library
```
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "OK",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok",
/*ro, opt, string, error information, desc:this field is required when statusCode is not 1*/
"MErrCode": "0x00000000",
/*ro, opt, string*/
"MErrDevSelfEx": "0x00000000"
/*ro, opt, string*/
```
}
```
Request URL
POST /ISAPI/Intelligent/FDLib/FDSearch?format=json
Query Parameter
None
Request Message
```
{
```
"searchResultPosition": 0,
/*req, int, the start position of the search result in the result list, desc:in a single search, if you cannot get all the records in the result list,
you can mark the end position and get the following records after the marked position in the next search*/
"maxResults": 100,
/*req, int, the maximum number of search results this time*/
"faceLibType": "blackFD",
/*req, enum, face picture library type, subType:string, desc:face picture library type: "blackFD"-list library,"staticFD"-static library,the maximum
size is 32 bytes*/
"FDID": "test",
/*req, string, face picture library ID, desc:face picture library ID,the maximum size is 63*/
"FPID": " ",
/*opt, string, face record ID*/
"startTime": "2004-05-03",
/*opt, string, start date of birth*/
"endTime": "2004-05-03",
/*opt, string, end time of birth*/
"name": "test",
/*opt, string, name*/
"gender": "any",
```
/*req, enum, gender, subType:string, desc:"any” (unlimited condition which is used in search), "male”, “female”, “unknown"*/
```
"city": "130100",
/*opt, string, city code, desc:city code of birth for the person in the face picture,the maximum size is 32 bytes*/
"certificateType": "ID",
/*req, enum, certificate type, subType:string, desc:the maximum size is 10 bytes,certificate type: "officerID"-officer ID,"ID"-identify
card,passport,other*/
"certificateNumber": "test",
/*opt, string, certificate No.*/
"isInLibrary": "yes",
```
/*opt, enum, whether the picture is in library (whether modeling is successful), subType:string, desc:whether modeling is successful: unknown, no, yes*/
```
"isDisplayCaptureNum": true,
/*opt, bool, whether to display number of captured pictures*/
"rowKey": "test",
/*opt, string, main key of face picture library, desc:searching by rowKey can be more efficient*/
"transfer": true
/*opt, bool, Transferring, desc:whether to enable transfer*/
```
}
```
Response Message
12.3.2.6 Search for the face records in the a face picture library or multiple face picture libraries
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"requestURL": "test",
/*ro, opt, string, request URL*/
"statusCode": 1,
/*ro, req, int, status code*/
"statusString": "test",
/*ro, req, string, status description*/
"subStatusCode": "activeNumMax",
/*ro, req, enum, sub status code, subType:string*/
"errorCode": 1,
/*ro, opt, int, detailed error description, this field is required when the value of statusCode is not 1*/
"errorMsg": "ok",
/*ro, opt, string, detailed error description, this field is required when the value of statusCode is not 1*/
"responseStatusStrg": "OK",
```
/*ro, opt, enum, status search, subType:string, desc:"OK" (searching completed), "MORE" (searching for more data), "NO MATCH" (no matched data).*/
```
"numOfMatches": 1,
/*ro, opt, int, number of results returned this time*/
"totalMatches": 1,
/*ro, opt, int, total number of matched results*/
"MatchList": [
/*ro, opt, array, list of matched records, subType:object*/
```
{
```
"FDID": "test",
/*ro, opt, string, face picture library ID*/
"FDName": "名单库A",
/*ro, opt, string*/
"FPID": "test",
/*ro, opt, string, face record ID*/
"faceURL": "test",
/*ro, opt, string, face picture URL*/
"name": "test",
/*ro, opt, string, name*/
"gender": "any",
```
/*ro, req, enum, gender, subType:string, desc:"any” (unlimited condition which is used in search), "male”, “female”, “unknown"*/
```
"bornTime": "2004-05-03",
/*ro, opt, string, birth date of the person in the face picture*/
"city": "130100",
/*ro, opt, string*/
"certificateType": "ID",
/*ro, req, enum, certificate type, subType:string*/
"certificateNumber": "test",
/*ro, opt, string, certificate No.*/
"caseInfo": "test",
/*ro, opt, string, remarks*/
"tag": "aa,bb,cc,dd",
/*ro, opt, string, custom tag*/
"address": "test",
/*ro, opt, string, person address*/
"customInfo": "test",
/*ro, opt, string, custom information*/
"isInLibrary": "yes",
/*ro, opt, enum, subType:string, desc:whether modeling is successful: unknown, no, yes*/
"captureNum": 12,
/*ro, opt, int, number of captured pictures*/
"rowKey": "test",
/*ro, opt, string, main key of face picture library, desc:searching by rowKey can be more efficient*/
"modelData": "test",
/*ro, opt, string, target modeling data, desc:during the process of transmission, the non-modeling binary data will be encrypted with Base64
method*/
"faceType": "normalFace",
/*ro, opt, enum, face picture library type, subType:string*/
"saveFacePic": true,
/*ro, opt, bool*/
"leaderPermission": [1, 2, 3, 4],
/*ro, opt, array, subType:int, range:[1,4]*/
"numberOfArrivalsAtSiteLastDays": [
/*ro, opt, array, subType:object*/
```
{
```
"day": 1,
/*ro, opt, int, range:[1,7]*/
"numberOfArrivalsAtSite": 3
/*ro, opt, int, range:[1,99]*/
```
}
```
],
"dwellTimeOnPreviousDay": 4,
/*ro, opt, int, range:[0,86400], unit:min*/
"totalNumberOfArrivalsAtSite": 4
/*ro, opt, int, range:[1,99]*/
```
}
```
]
```
}
```
Request URL
PUT /ISAPI/Intelligent/FDLib/FDSearch?format=json&FDID=<FDID>&FPID=<FPID>&faceLibType=<faceLibType>
12.3.2.7 Edit a face record in a specific face picture library
Hikvision co MMC
adil@hikvision.co.az
Query Parameter
Parameter
Name
Parameter
Type Description
FDID string Face picture library ID, and the maximum length is 63 bytes. Create a face picture library:POST /ISAPI/Intelligent/FDLib?format=json, and it is returned for success.
FPID string Face record ID, and the maximum length is 63 bytes. Add face record: POST/ISAPI/Intelligent/FDLib?format=json, and it is returned for success.
```
faceLibType string Face picture library type: "blackFD” (list library), "staticFD” (static library).
```
Request Message
```
{
```
"faceURL": "test",
/*opt, string, face picture URL, range:[0,256]*/
"name": "张三",
/*req, string, name of person in the face picture, range:[0,96]*/
"gender": "male",
/*opt, enum, gender of person in the face picture, subType:string, desc:"male", "female", "unknown"*/
"bornTime": "1970-01-01+08:00",
/*req, date, birthday of person in the face picture, ISO8601 time format, the maximum size is 20 bytes*/
"city": "130100",
/*opt, string, city code of birth for the person in the face picture, the maximum size is 32 bytes*/
"certificateType": "officerID",
/*opt, enum, certificate type, subType:string, desc:certificate type*/
"certificateNumber": "test",
/*opt, string, certificate No., the maximum size is 32 bytes*/
"caseInfo": "test",
/*opt, string, remarks, range:[0,192], desc:case information,the maximum size is 192 bytes,it is valid when faceLibType is blackFD*/
"tag": "aa,bb,cc,dd",
/*opt, string, custom tag, range:[0,195], desc:up to 4 tags, which are separated by commas. It is valid when faceLibType is blackFD*/
"address": "test",
/*opt, string, person address, range:[0,192], desc:person address,the maximum size is 192 bytes,it is valid when faceLibType is staticFD.*/
"customInfo": "test",
/*opt, string, custom information, range:[0,192], desc:custom information,the maximum size is 192 bytes,it is valid when faceLibType is staticFD.*/
"modelData": "test",
/*opt, string, target modeling data, desc:during the process of transmission, the non-modeling binary data will be encrypted with Base64 method*/
"rowKey": "test",
/*opt, string, main key of face picture library, range:[0,64], desc:searching by rowKey can be more efficient*/
"transfer": true,
/*opt, bool, whether to enable transfer, desc:whether to enable transfer*/
"PicFeaturePoints": [
/*opt, array, feature points to be applied., subType:object, desc:If the device only supports three types of feature points, when the platform applies
more than three types of feature points, the device will not return error information*/
```
{
```
"featurePointType": "face",
```
/*req, enum, feature point type, subType:string, desc:"face", "leftEye" (left eye), "rightEye" (right eye), "leftMouthCorner" (left corner of
```
```
mouth), "rightMouthCorner" (right corner of mouth), "nose”*/
```
```
"coordinatePoint": {
```
/*opt, object, region, desc:object,coordinates of the feature point*/
"x": 1,
/*req, int, X-coordinate, range:[0,1000], desc:normalized X-coordinate which is between 0 and 1000*/
"y": 1,
/*req, int, Y-coordinate, range:[0,1000], desc:normalized Y-coordinate which is between 0 and 1000*/
"width": 1,
/*opt, int, width, range:[0,1000], desc:width which is between 0 and 1000. This node is required when featurePointType is "face"*/
"height": 1
/*opt, int, height, range:[0,1000], desc:height which is between 0 and 1000. This node is required when featurePointType is "face"*/
```
}
```
```
}
```
],
"faceType": "normalFace",
/*opt, enum, face picture type, subType:string, desc:face picture type*/
"saveFacePic": true,
/*opt, bool, whether to save face pictures*/
"leaderPermission": [1, 2, 3, 4]
/*opt, array, subType:int, range:[1,4]*/
```
}
```
Response Message
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "OK",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok",
/*ro, opt, string, error details, desc:this node is required when the value of statusCode is not 1*/
"MErrCode": "0x00000000",
/*ro, opt, string*/
"MErrDevSelfEx": "0x00000000"
/*ro, opt, string*/
```
}
```
Request URL
PUT /ISAPI/Intelligent/FDLib/FDSetUp?format=json
Query Parameter
None
Request Message
```
{
```
"faceURL": "http",
/*opt, string, picture storage URL, which is inputted when uploading the face picture by URL*/
"faceLibType": "blackFD",
```
/*req, enum, face picture library type, subType:string, desc:"blackFD" (list library), "staticFD" (static library), the maximum length is 32 bytes*/
```
"FDID": "test",
/*req, string, face picture library ID, desc:the maximum length is 63 bytes. Multiple libraries are separated by commas*/
"FPID": " ",
/*opt, string, face record ID, desc:it can be generated by the device or inputted. If it is inputted, it should be the unique ID with the combination of
```
letters and digits, and the maximum length is 63 bytes; if it is generated by the device automatically, it is the same as the employee No. (person ID)*/
```
"deleteFP": true,
```
/*opt, bool, whether to delete the face record, desc:true (yes). This field required when the face record needs to be deleted; for adding or editing the
```
face record, it should not be configured*/
"modelData": "test",
/*opt, string, target model data, desc:during the process of transmission, the non-modeling binary data will be encrypted with Base64 method*/
"PicFeaturePoints": [
/*opt, array, feature picture coordinates, subType:object, desc:if the device only supports three types of feature points, when the platform applies
more than three types of feature points, the device will not return error information*/
```
{
```
"featurePointType": "face",
```
/*req, enum, feature point type, subType:string, desc:"face", "leftEye" (left eye), "rightEye" (right eye), "leftMouthCorner" (left corner of
```
```
mouth), "rightMouthCorner" (right corner of mouth), "nose"*/
```
```
"coordinatePoint": {
```
/*opt, object, coordinates of the feature point*/
"x": 1,
/*req, int, X-coordinate, range:[0,1000], desc:normalized coordinates*/
"y": 1,
/*req, int, Y-coordinate, range:[0,1000], desc:normalized coordinates*/
"width": 1,
/*opt, int, width, range:[0,1000], desc:it is required when featurePointType is "face"*/
"height": 1
/*opt, int, height, range:[0,1000], desc:it is required when featurePointType is "face"*/
```
}
```
```
}
```
],
"faceType": "normalFace",
```
/*opt, enum, face picture type, subType:string, desc:"normalFace" (normal face, default value), "patrolFace" (patrol person face), "hijackFace" (duress
```
```
person face), "superFace" (super person face)*/
```
"saveFacePic": true,
/*opt, bool, whether to save the registered face picture*/
"leaderPermission": [1, 2, 3, 4]
/*opt, array, first authentication permission, subType:int, range:[1,4], desc:first authentication permission*/
```
}
```
Parameter
Name Parameter Value
```
Parameter Type(Content-
```
```
Type)
```
Content-
ID File Name Description
faceURL [Message content] application/json -- -- --
img [Binary picturedata] image/jpeg faceImage.jpg --
12.3.2.8 Set the face picture data in the face picture library
Hikvision co MMC
adil@hikvision.co.az
Note： The protocol is transmitted in form format. See Chapter 4.5.1.4 for form framework description, as shown in
the instance below.
--<frontier>
```
Content-Disposition: form-data; name=Parameter Name;filename=File Name
```
Content-Type: Parameter Type
Content-Length: ****
Content-ID: Content ID
Parameter Value
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, req, int, error code, desc:it is required when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, req, string, error information, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/System/TwoWayAudio/channels
Query Parameter
None
Request Message
None
Response Message
```
Parameter Name: the name property of Content-Disposition in the header of form unit; it refers to the form unit
```
name.
```
Parameter Type (Content-Type): the Content-Type property in the header of form unit.
```
```
File Name (filename): the filename property of Content-Disposition of form unit Headers. It exists only when the
```
transmitted data of form unit is file, and it refers to the file name of form unit body.
Parameter Value: the body content of form unit.
12.4 Two-Way Audio
12.4.1 Two-Way Audio
12.4.1.1 Get the parameters of all two-way audio channels
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<TwoWayAudioChannelList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, array, parameters configuration of the two-way audio channel, subType:object, attr:version{opt, string, protocolVersion}-->
```
<TwoWayAudioChannel>
<!--ro, opt, object, configuration of the two-way audio channel-->
<id>
<!--ro, req, string, audio channel ID-->1
</id>
<enabled>
<!--ro, req, bool, whether to enable or not-->true
</enabled>
<audioCompressionType>
<!--ro, req, enum, encoding type of the audio output, subType:string, desc:"G.711alaw", "G.711ulaw", "G.726", "G.729", "G.729a", "G.729b", "PCM",
"MP3", "AC3", "AAC", "ADPCM", "MP2L2", "Opus"-->G.711alaw
</audioCompressionType>
<audioInboundCompressionType>
<!--ro, opt, enum, encoding type of the audio input, subType:string, desc:"G.711alaw", "G.711ulaw", "G.726", "G.729", "G.729a", "G.729b", "PCM",
"MP3", "AC3", "AAC", "ADPCM"-->G.711alaw
</audioInboundCompressionType>
<speakerVolume>
<!--ro, opt, int, input volume, range:[1,100]-->100
</speakerVolume>
<microphoneVolume>
<!--ro, opt, int, output volume, range:[1,100]-->100
</microphoneVolume>
<noisereduce>
<!--ro, opt, bool, whether to enable the environmental noise filter or not-->true
</noisereduce>
<audioBitRate>
<!--ro, opt, int, audio frame rate, unit:kbs-->100
</audioBitRate>
<audioInputType>
```
<!--ro, opt, enum, audio input type, subType:string, desc:"MicIn" (microphone-level input), "LineIn" (line-level input), "selfAdaptive" (self-
```
```
adaptive), "wirelessPickUp" (wireless audio pickup)-->MicIn
```
</audioInputType>
<associateVideoInputs>
<!--ro, opt, object, linked video channel-->
<enabled>
<!--ro, req, bool, whether to enable the linked video input channel or not-->true
</enabled>
<videoInputChannelList>
<!--ro, req, array, list of linked video channels, subType:object-->
<videoInputChannelID>
<!--ro, opt, string, linked video channel-->1
</videoInputChannelID>
</videoInputChannelList>
</associateVideoInputs>
<audioSamplingRate>
<!--ro, opt, float, audio sampling rate, unit:kHz-->48.00
</audioSamplingRate>
<lineOutForbidden>
```
<!--ro, opt, bool, whether the audio output is not supported. If this node is not returned or its value is "false", audio output is supported; if the
```
value is "true", audio output is not supported-->true
</lineOutForbidden>
<muteDuringPanTilt>
<!--ro, opt, bool, whether to mute during motion-->true
</muteDuringPanTilt>
<audioOutputType>
```
<!--ro, opt, enum, audio output type, subType:string, desc:"Close" (output closed), "LineOut" (line-level output), "Speaker" (speaker output),
```
```
"selfAdaptive" (self-adaptive), "LineOut_Speaker" (both line-level output and speaker output)-->LineOut
```
</audioOutputType>
<matrixPickUp>
```
<!--ro, opt, bool, whether to use the wired matrix pickup or not (this node will not be returned if the wired matrix pickup is not supported, and it
```
```
is valid only when the audio input type is "Linein")-->true
```
</matrixPickUp>
</TwoWayAudioChannel>
</TwoWayAudioChannelList>
Request URL
PUT /ISAPI/System/TwoWayAudio/channels
Query Parameter
None
Request Message
12.4.1.2 Set audio parameters for all two-way audio channels
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<TwoWayAudioChannelList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--opt, array, parameters configuration of the two-way audio channel, subType:object, attr:version{opt, string, protocolVersion}-->
```
<TwoWayAudioChannel>
<!--opt, object, configuration of the two-way audio channel-->
<id>
<!--req, string, audio channel ID-->1
</id>
<enabled>
<!--req, bool, whether to enable the function or not-->true
</enabled>
<audioCompressionType>
<!--req, enum, encoding type of the audio output, subType:string, desc:"G.711alaw", "G.711ulaw", "G.726", "G.729", "G.729a", "G.729b", "PCM", "MP3",
"AC3", "AAC", "ADPCM", "MP2L2", "Opus"-->G.711alaw
</audioCompressionType>
<audioInboundCompressionType>
<!--req, enum, encoding type of the audio input, subType:string, desc:"G.711alaw", "G.711ulaw", "G.726", "G.729", "G.729a", "G.729b", "PCM", "MP3",
"AC3", "AAC", "ADPCM"-->G.711alaw
</audioInboundCompressionType>
<speakerVolume>
<!--opt, int, input volume-->100
</speakerVolume>
<microphoneVolume>
<!--opt, int, output volume-->100
</microphoneVolume>
<noisereduce>
<!--opt, bool, whether to enable the environmental noise filter or not-->true
</noisereduce>
<audioBitRate>
<!--opt, int, audio frame rate, unit:kbs-->100
</audioBitRate>
<audioInputType>
```
<!--req, enum, audio input type, subType:string, desc:"MicIn" (microphone-level input), "LineIn" (line-level input), "selfAdaptive" (self-adaptive),
```
```
"wirelessPickUp" (wireless audio pickup)-->MicIn
```
</audioInputType>
<associateVideoInputs>
<!--opt, object, linked video channel-->
<enabled>
<!--req, bool, whether to enable the linked video input channel or not-->true
</enabled>
<videoInputChannelList>
<!--req, array, list of linked video channels, subType:object-->
<videoInputChannelID>
<!--opt, string, linked video channel-->1
</videoInputChannelID>
</videoInputChannelList>
</associateVideoInputs>
<audioSamplingRate>
<!--opt, float, audio sampling rate, unit:kHz-->48.00
</audioSamplingRate>
<lineOutForbidden>
```
<!--opt, bool, whether the audio output is not supported. If this node is not returned or its value is "false", audio output is supported; if the
```
value is "true", audio output is not supported-->true
</lineOutForbidden>
<muteDuringPanTilt>
<!--opt, bool, whether to mute during motion-->true
</muteDuringPanTilt>
<audioOutputType>
```
<!--opt, enum, audio output type, subType:string, desc:"Close" (output closed), "LineOut" (line-level output), "Speaker" (speaker output),
```
```
"selfAdaptive" (self-adaptive), "LineOut_Speaker" (both line-level output and speaker output)-->LineOut
```
</audioOutputType>
<matrixPickUp>
```
<!--opt, bool, whether to use the wired matrix pickup or not (this node is valid only when the audio input type is "Linein")-->true
```
</matrixPickUp>
</TwoWayAudioChannel>
</TwoWayAudioChannelList>
Response Message
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, which describes the error in details, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/System/TwoWayAudio/channels/<audioID>/audioData?sessionId=<audioSessionID>
Query Parameter
Parameter Name Parameter Type Description
audioID string --
audioSessionID string --
Request Message
Binary Data
Response Message
Binary Data
Request URL
PUT /ISAPI/System/TwoWayAudio/channels/<audioID>/audioData?sessionId=<audioSessionID>&type=<type>
Query Parameter
Parameter
Name
Parameter
Type Description
audioID string --
audioSessionID string Two-way audio session ID
type string
If this filed does not exist, it indicates two-way audio via channel, and the audioID is the
channel ID. When the type is childDevID, it indicates two-way audio with a single sub-
```
device, and the audioID is the gateway intercom resource index (obtained from
```
```
/ISAPI/System/DynamicResource/SearchResources?format=json); when the type is
```
childDevList, it indicates broadcasting to multiple sub-devices, with multiple childDevID
values configured in /ISAPI/System/TwoWayAudio/channels//open.
Request Message
Binary Data
Response Message
12.4.1.3 Receive two-way audio data
12.4.1.4 Send two-way audio data
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, opt, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, which describes the error in details, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
<description>
<!--ro, opt, string, Custom Error Information Description, range:[0,1024], desc:Custom detailed error information returned by device application, used
for quick positioning and diagnosis.-->badXmlFormat
</description>
<MErrCode>
<!--ro, opt, string, error codes categorized by functional modules, desc:all general error codes are in the range of this field-->0x00000000
</MErrCode>
<MErrDevSelfEx>
<!--ro, opt, string, error codes categorized by functional modules, desc:N/A-->0x00000000
</MErrDevSelfEx>
</ResponseStatus>
Request URL
PUT /ISAPI/System/TwoWayAudio/channels/<twoWayAudioChannelID>
Query Parameter
Parameter Name Parameter Type Description
twoWayAudioChannelID string --
Request Message
12.4.1.5 Set audio parameters of a specified two-way audio channel
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<TwoWayAudioChannel xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--opt, object, configuration of the two-way audio channel, attr:version{opt, string, protocolVersion}-->
```
<id>
<!--req, string, audio channel ID-->1
</id>
<enabled>
<!--req, bool, whether to enable or not-->true
</enabled>
<audioCompressionType>
<!--req, enum, encoding type of the audio output, subType:string, desc:"G.711alaw", "G.711ulaw", "G.726", "G.729", "G.729a", "G.729b", "PCM", "MP3",
"AC3", "AAC", "ADPCM", "MP2L2", "Opus"-->G.711alaw
</audioCompressionType>
<audioInboundCompressionType>
<!--opt, enum, encoding type of the audio input, subType:string, desc:"G.711alaw", "G.711ulaw", "G.726", "G.729", "G.729a", "G.729b", "PCM", "MP3",
"AC3", "AAC", "ADPCM"-->G.711alaw
</audioInboundCompressionType>
<speakerVolume>
<!--opt, int, input volume, range:[1,100]-->100
</speakerVolume>
<microphoneVolume>
<!--opt, int, output volume, range:[1,100]-->100
</microphoneVolume>
<noisereduce>
<!--opt, bool, whether to enable the environmental noise filter or not-->true
</noisereduce>
<audioBitRate>
<!--opt, int, audio frame rate, unit:kbs-->100
</audioBitRate>
<audioInputType>
```
<!--opt, enum, audio input type, subType:string, desc:"MicIn" (microphone-level input), "LineIn" (line-level input), "selfAdaptive" (self-adaptive),
```
```
"wirelessPickUp" (wireless audio pickup)-->MicIn
```
</audioInputType>
<associateVideoInputs>
<!--opt, object, linked video channel-->
<enabled>
<!--req, bool, whether to enable the linked video input channel or not-->true
</enabled>
<videoInputChannelList>
<!--req, array, list of linked video channels, subType:object-->
<videoInputChannelID>
<!--opt, string, linked video channel-->1
</videoInputChannelID>
</videoInputChannelList>
</associateVideoInputs>
<audioSamplingRate>
<!--opt, float, audio sampling rate, unit:kHz-->48.00
</audioSamplingRate>
<lineOutForbidden>
```
<!--opt, bool, whether the audio output is not supported. If this node is not returned or its value is "false", audio output is supported; if the value
```
is "true", audio output is not supported-->true
</lineOutForbidden>
<micInForbidden>
```
<!--opt, bool, whether the audio input is not supported. If this node is not returned or its value is "false", audio input is supported; if the value
```
is "true", audio input is not supported-->true
</micInForbidden>
<muteDuringPanTilt>
<!--opt, bool, whether to mute during motion-->true
</muteDuringPanTilt>
<audioOutputType>
```
<!--opt, enum, audio output type, subType:string, desc:"Close" (output closed), "LineOut" (line-level output), "Speaker" (speaker output),
```
```
"selfAdaptive" (self-adaptive), "LineOut_Speaker" (both line-level output and speaker output)-->LineOut
```
</audioOutputType>
<timeOut>
<!--opt, int, timeout during two-way audio, range:[10,600], unit:s, desc:when the Web Client initiates the two-way audio actively towards the radar
device, the noise data will be transmitted to the radar device although the person on the Web Client does not speak, because there is always some noise.
When this node is configured, the device will stop the two-way audio after a specific time period, regardless of whether the person on the Web Client stops
speaking or not.-->10
</timeOut>
<matrixPickUp>
```
<!--opt, bool, whether to use the wired matrix pickup or not (this node is valid only when the audio input type is "Linein")-->true
```
</matrixPickUp>
</TwoWayAudioChannel>
Response Message
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, which describes the error in details, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/System/TwoWayAudio/channels/<twoWayAudioChannelID>/capabilities?audioInputType=
<audioInputType>
Query Parameter
Parameter Name ParameterType Description
twoWayAudioChannelID string Two-way audio channel No.
audioInputType string
Audio input type, corresponding to the "audioInputType" in the message. This
parameter is mainly used to obtain the parameters corresponding to the
specified audio input type.
Request Message
None
Response Message
12.4.1.6 Get the capability of configuring audio parameters for a specified two-way audio channel
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<TwoWayAudioChannel xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, capability of configuring audios for the two-way audio channel, attr:version{opt, string, protocolVersion}-->
```
<id>
<!--ro, req, string, audio channel ID-->1
</id>
<enabled>
<!--ro, req, bool, whether to enable or not-->true
</enabled>
<audioCompressionType opt="G.711alaw,G.711ulaw,G.726,G.729,G.729a,G.729b,PCM,MP3,AC3,AAC,ADPCM,MP2L2,Opus,G.722.1">
```
<!--ro, req, enum, encoding type of the audio output, subType:string, attr:opt{opt, string}, desc:"G.711alaw", "G.711ulaw", "G.726", "G.729", "G.729a",
```
"G.729b", "PCM", "MP3", "AC3", "AAC", "ADPCM", "MP2L2", "Opus", "G.722.1"-->G.711alaw
</audioCompressionType>
<audioInboundCompressionType opt="G.711alaw,G.711ulaw,G.726,G.729,G.729a,G.729b,PCM,MP3,AC3,AAC,ADPCM,G.722.1">
```
<!--ro, opt, enum, encoding type of the audio input, subType:string, attr:opt{opt, string}, desc:"G.711alaw", "G.711ulaw", "G.726", "G.729", "G.729a",
```
"G.729b", "PCM", "MP3", "AC3", "AAC", "ADPCM"-->G.711alaw
</audioInboundCompressionType>
<speakerVolume min="0" max="100">
```
<!--ro, opt, int, input volume, attr:min{opt, int},max{opt, int}-->100
```
</speakerVolume>
<microphoneVolume min="0" max="100">
```
<!--ro, opt, int, output volume, attr:min{opt, int},max{opt, int}-->100
```
</microphoneVolume>
<noisereduce opt="true,false">
```
<!--ro, opt, bool, whether to enable the environmental noise filter or not, attr:opt{opt, string}-->true
```
</noisereduce>
<audioBitRate min="1" max="100">
```
<!--ro, opt, int, audio frame rate, unit:kbs, attr:min{opt, int},max{opt, int}-->100
```
</audioBitRate>
<audioInputType opt="MicIn,LineIn,selfAdaptive,wirelessPickUp,doubleMic,networkPickUp">
```
<!--ro, opt, enum, audio input type, subType:string, attr:opt{opt, string}, desc:"MicIn" (microphone-level input), "LineIn" (line-level input),
```
```
"selfAdaptive" (self-adaptive), "wirelessPickUp" (wireless audio pickup)-->MicIn
```
</audioInputType>
<associateVideoInputs>
<!--ro, opt, object, linked video channel-->
<enabled opt="true,false">
```
<!--ro, req, bool, whether to enable the linked video input channel or not, attr:opt{opt, string}-->true
```
</enabled>
<videoInputChannelList>
<!--ro, req, array, list of linked video channels, subType:object-->
<videoInputChannelID min="1" max="2048">
```
<!--ro, opt, string, linked video channel, attr:min{opt, string},max{opt, string}-->1
```
</videoInputChannelID>
</videoInputChannelList>
</associateVideoInputs>
<audioSamplingRate min="1.00" max="48.00">
```
<!--ro, opt, float, audio sampling rate, unit:kHz, attr:min{opt, float},max{opt, float}-->48.00
```
</audioSamplingRate>
<lineOutForbidden opt="true,false">
```
<!--ro, opt, bool, whether the audio output is not supported. If this node is not returned or its value is "false", audio output is supported; if the
```
```
value is "true", audio output is not supported, attr:opt{opt, string}-->true
```
</lineOutForbidden>
<muteDuringPanTilt opt="true,false">
```
<!--ro, opt, bool, whether to mute during motion, attr:opt{opt, string}-->true
```
</muteDuringPanTilt>
<audioOutputType opt="Close,LineOut,Speaker,selfAdaptive,LineOut_Speaker,HDMI" def="LineOut">
```
<!--ro, opt, enum, audio output type, subType:string, attr:opt{opt, string},def{opt, string}, desc:"Close" (output closed), "LineOut" (line-level
```
```
output), "Speaker" (speaker output), "selfAdaptive" (self-adaptive), "LineOut_Speaker" (both line-level output and speaker output)-->LineOut
```
</audioOutputType>
<isSupportEchoCancellation>
<!--ro, opt, bool, whether the device supports echo cancellation-->true
</isSupportEchoCancellation>
<timeOut min="10" max="600">
```
<!--ro, opt, int, timeout during two-way audio, attr:min{req, int},max{req, int}, desc:when the Web Client initiates the two-way audio actively towards
```
the radar device, the noise data will be transmitted to the radar device although the person on the Web Client does not speak, because there is always some
noise. When this node is configured, the device will stop the two-way audio after a specific time period, regardless of whether the person on the Web Client
stops speaking or not.-->300
</timeOut>
<matrixPickUp opt="true,false">
```
<!--ro, opt, bool, whether to use the wired matrix pickup or not (this node will not be returned if the wired matrix pickup is not supported, and it is
```
```
valid only when the audio input type is "Linein"), attr:opt{opt, string}-->false
```
</matrixPickUp>
<isSupportRestore>
<!--ro, opt, bool, whether the device supports restoring audio parameters of the two-way audio channel, desc:corresponding API:
/ISAPI/System/TwoWayAudio/channels/<twoWayAudioChannelID>/restore?format=json-->true
</isSupportRestore>
<networkPickUpStatus opt="online,offline">
```
<!--ro, opt, enum, network pick-up status, subType:string, dep:and,{$.TwoWayAudioChannel.audioInputType,eq,networkPickUp}, attr:opt{opt, string},
```
```
desc:network status of the network pickup linked with the audio channel: "online", "offline"-->online
```
</networkPickUpStatus>
<noisereduceType opt="normal,smart">
```
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->normal
```
</noisereduceType>
</TwoWayAudioChannel>
Request URL
12.4.1.7 Stop two-way audio
Hikvision co MMC
adil@hikvision.co.az
PUT /ISAPI/System/TwoWayAudio/channels/<twoWayAudioChannelID>/close?sessionId=<audioSessionID>
Query Parameter
Parameter Name Parameter Type Description
twoWayAudioChannelID string Two-Way Audio Channel ID
audioSessionID string --
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, which describes the error in details, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
<description>
<!--ro, opt, string, Custom Error Information Description, range:[0,1024], desc:Custom detailed error information returned by device application, used
for quick positioning and diagnosis.-->badXmlFormat
</description>
</ResponseStatus>
Request URL
PUT /ISAPI/System/TwoWayAudio/channels/<twoWayAudioChannelID>/open?type=<type>
Query Parameter
Parameter Name ParameterType Description
twoWayAudioChannelID string Two-way audio channel No.
type string
If this filed does not exist, it indicates two-way audio via channel, and the
audioID is the channel ID. When the type is childDevID, it indicates two-way
audio with a single sub device, and the audioID is the gateway intercom
```
resource index (obtained from
```
```
/ISAPI/System/DynamicResource/SearchResources?format=json); when the
```
type is childDevList, it indicates broadcasting to multiple sub devices, with
multiple childDevID values specified in the message, and the audioID in the
URL is invalid.
Request Message
12.4.1.8 Start two-way audio
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<TwoWayAudio xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--opt, object, parameters for this two-way audio, attr:version{req, string, protocolVersion}-->
```
<audioLevel>
<!--opt, int, audio level, range:[0,15], desc:range: [0,15]-->0
</audioLevel>
<microphoneVolume>
<!--opt, int, output volume-->100
</microphoneVolume>
<audioCompressionType>
<!--opt, enum, encoding type of the audio output, subType:string, desc:"G.711alaw", "G.711ulaw", "G.726", "G.729", "G.729a", "G.729b", "PCM", "MP3",
"AC3", "AAC", "ADPCM", "MP2L2", "Opus", "G.722.1"-->G.711alaw
</audioCompressionType>
<audioSamplingRate>
<!--opt, float, audio sampling rate, unit:kHz-->48.00
</audioSamplingRate>
<isBroadcast>
<!--opt, bool-->true
</isBroadcast>
<broadcastType>
<!--opt, enum, subType:string-->alarm
</broadcastType>
<childList>
```
<!--opt, array, subType:object, range:[0,8], dep:and,{$.TwoWayAudio.isBroadCast,eq,true}-->
```
<childDevID>
<!--opt, string, range:[9,32]-->test
</childDevID>
<voiceTalkIndex>
<!--opt, int, range:[1,256]-->test
</voiceTalkIndex>
</childList>
</TwoWayAudio>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<TwoWayAudioSession xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, result returned when starting two-way audio succeeds, attr:version{opt, string, protocolVersion}-->
```
<sessionId>
<!--ro, req, string, two-way audio session ID-->1
</sessionId>
</TwoWayAudioSession>
Request URL
GET /ISAPI/System/TwoWayAudio/channels/<twoWayAudioChannelID>?audioInputType=<audioInputType>
Query Parameter
Parameter Name ParameterType Description
twoWayAudioChannelID string Two-way audio channel No.
audioInputType string
Audio input type, corresponding to the "audioInputType" in the message. This
parameter is mainly used to obtain the parameters corresponding to the
specified audio input type.
Request Message
None
Response Message
12.4.1.9 Get the audio parameters of a specified two-way audio channel
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<TwoWayAudioChannel xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, configuration of the two-way audio channel, attr:version{opt, string, protocolVersion}-->
```
<id>
<!--ro, req, string, audio channel ID-->1
</id>
<enabled>
<!--ro, req, bool, whether to enable or not-->true
</enabled>
<audioCompressionType>
<!--ro, req, enum, encoding type of the audio output, subType:string, desc:"G.711alaw", "G.711ulaw", "G.726", "G.729", "G.729a", "G.729b", "PCM", "MP3",
"AC3", "AAC", "ADPCM", "MP2L2", "Opus", "G.722.1"-->G.711alaw
</audioCompressionType>
<audioInboundCompressionType>
<!--ro, opt, enum, encoding type of the audio input, subType:string, desc:"G.711alaw", "G.711ulaw", "G.726", "G.729", "G.729a", "G.729b", "PCM", "MP3",
"AC3", "AAC", "ADPCM"-->G.711alaw
</audioInboundCompressionType>
<speakerVolume>
<!--ro, opt, int, input volume, range:[1,100]-->100
</speakerVolume>
<microphoneVolume>
<!--ro, opt, int, output volume, range:[1,100]-->100
</microphoneVolume>
<noisereduce>
<!--ro, opt, bool, whether to enable the environmental noise filter or not-->true
</noisereduce>
<audioBitRate>
<!--ro, opt, int, audio frame rate, unit:kbs-->100
</audioBitRate>
<audioInputType>
```
<!--ro, opt, enum, audio input type, subType:string, desc:"MicIn" (microphone-level input), "LineIn" (line-level input), "selfAdaptive" (self-adaptive),
```
```
"wirelessPickUp" (wireless audio pickup)-->MicIn
```
</audioInputType>
<associateVideoInputs>
<!--ro, opt, object, linked video channel-->
<enabled>
<!--ro, req, bool, whether to enable the linked video input channel or not-->true
</enabled>
<videoInputChannelList>
<!--ro, req, array, list of linked video channels, subType:object-->
<videoInputChannelID>
<!--ro, opt, string, linked video channel-->1
</videoInputChannelID>
</videoInputChannelList>
</associateVideoInputs>
<audioSamplingRate>
<!--ro, opt, float, audio sampling rate, unit:kHz-->48.00
</audioSamplingRate>
<lineOutForbidden>
```
<!--ro, opt, bool, whether the audio output is not supported. If this node is not returned or its value is "false", audio output is supported; if the
```
value is "true", audio output is not supported-->true
</lineOutForbidden>
<micInForbidden>
```
<!--ro, opt, bool, whether the audio input is not supported. If this node is not returned or its value is "false", audio input is supported; if the
```
value is "true", audio input is not supported-->true
</micInForbidden>
<muteDuringPanTilt>
<!--ro, opt, bool, whether to mute during motion-->true
</muteDuringPanTilt>
<audioOutputType>
```
<!--ro, opt, enum, audio output type, subType:string, desc:"Close" (output closed), "LineOut" (line-level output), "Speaker" (speaker output),
```
```
"selfAdaptive" (self-adaptive), "LineOut_Speaker" (both line-level output and speaker output)-->LineOut
```
</audioOutputType>
<timeOut>
<!--ro, opt, int, timeout during two-way audio, range:[10,600], unit:s, desc:when the Web Client initiates the two-way audio actively towards the radar
device, the noise data will be transmitted to the radar device although the person on the Web Client does not speak, because there is always some noise.
When this node is configured, the device will stop the two-way audio after a specific time period, regardless of whether the person on the Web Client stops
speaking or not.-->10
</timeOut>
<matrixPickUp>
```
<!--ro, opt, bool, whether to use the wired matrix pickup or not (this node is valid only when the audio input type is "Linein")-->true
```
</matrixPickUp>
<networkPickUpStatus>
```
<!--ro, opt, enum, subType:string, dep:and,{$.TwoWayAudioChannel.audioInputType,eq,networkPickUp}-->online
```
</networkPickUpStatus>
<noisereduceType>
<!--ro, opt, enum, subType:string-->normal
</noisereduceType>
</TwoWayAudioChannel>
Request URL
GET /ISAPI/System/TwoWayAudio/channels/capabilities
Query Parameter
12.4.1.10 Get the capability of configuring parameters for all two-way audio channels
Hikvision co MMC
adil@hikvision.co.az
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<TwoWayAudioChannelList xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, capability of configuring audios for all two-way audio channels, attr:version{opt, string, protocolVersion}-->
```
<TwoWayAudioChannel>
<!--ro, opt, object, capability of configuring audios for the two-way audio channel-->
<id>
<!--ro, req, string, audio channel ID-->1
</id>
<enabled>
<!--ro, req, bool, whether to enable or not-->true
</enabled>
<audioCompressionType opt="G.711alaw,G.711ulaw,G.726,G.729,G.729a,G.729b,PCM,MP3,AC3,AAC,ADPCM,MP2L2,Opus">
```
<!--ro, req, enum, encoding type of the audio output, subType:string, attr:opt{opt, string}, desc:"G.711alaw", "G.711ulaw", "G.726", "G.729",
```
"G.729a", "G.729b", "PCM", "MP3", "AC3", "AAC", "ADPCM", "MP2L2", "Opus"-->G.711alaw
</audioCompressionType>
<audioInboundCompressionType opt="G.711alaw,G.711ulaw,G.726,G.729,G.729a,G.729b,PCM,MP3,AC3,AAC,ADPCM">
```
<!--ro, opt, enum, encoding type of the audio input, subType:string, attr:opt{opt, string}, desc:"G.711alaw", "G.711ulaw", "G.726", "G.729", "G.729a",
```
"G.729b", "PCM", "MP3", "AC3", "AAC", "ADPCM"-->G.711alaw
</audioInboundCompressionType>
<speakerVolume min="0" max="100">
```
<!--ro, opt, int, input volume, attr:min{opt, int},max{opt, int}-->100
```
</speakerVolume>
<microphoneVolume min="0" max="100">
```
<!--ro, opt, int, output volume, attr:min{opt, int},max{opt, int}-->100
```
</microphoneVolume>
<noisereduce opt="true,false">
```
<!--ro, opt, bool, whether to enable the environmental noise filter or not, attr:opt{opt, string}-->true
```
</noisereduce>
<audioBitRate min="1" max="100">
```
<!--ro, opt, int, audio frame rate, unit:kbs, attr:min{opt, string},max{opt, string}-->100
```
</audioBitRate>
<audioInputType opt="MicIn,LineIn,selfAdaptive,wirelessPickUp">
```
<!--ro, opt, enum, audio input type, subType:string, attr:opt{opt, string}, desc:"MicIn" (microphone-level input), "LineIn" (line-level input),
```
```
"selfAdaptive" (self-adaptive), "wirelessPickUp" (wireless audio pickup)-->MicIn
```
</audioInputType>
<associateVideoInputs>
<!--ro, opt, object, linked video channel-->
<enabled opt="true,false">
```
<!--ro, req, bool, whether to enable the linked video input channel or not, attr:opt{opt, string}-->true
```
</enabled>
<videoInputChannelList>
<!--ro, req, array, list of linked video channels, subType:object-->
<videoInputChannelID min="1" max="2048">
```
<!--ro, opt, string, linked video channel, attr:min{opt, string},max{opt, string}-->1
```
</videoInputChannelID>
</videoInputChannelList>
</associateVideoInputs>
<audioSamplingRate min="1.00" max="48.00">
```
<!--ro, opt, float, audio sampling rate, unit:kHz, attr:min{opt, float},max{opt, float}-->48.00
```
</audioSamplingRate>
<lineOutForbidden opt="true,false">
```
<!--ro, opt, bool, whether the audio output is not supported. If this node is not returned or its value is "false", audio output is supported; if the
```
```
value is "true", audio output is not supported, attr:opt{opt, string}-->true
```
</lineOutForbidden>
<muteDuringPanTilt opt="true,false">
```
<!--ro, opt, bool, whether to mute during motion, attr:opt{opt, string}-->true
```
</muteDuringPanTilt>
<audioOutputType opt="Close,LineOut,Speaker,selfAdaptive,LineOut_Speaker" def="LineOut">
```
<!--ro, opt, enum, audio output type, subType:string, attr:opt{opt, string},def{opt, string}, desc:"Close" (output closed), "LineOut" (line-level
```
```
output), "Speaker" (speaker output), "selfAdaptive" (self-adaptive), "LineOut_Speaker" (both line-level output and speaker output)-->LineOut
```
</audioOutputType>
<isSupportEchoCancellation>
<!--ro, opt, bool, whether the device supports echo cancellation-->true
</isSupportEchoCancellation>
<matrixPickUp opt="true,false">
```
<!--ro, opt, bool, whether to use the wired matrix pickup or not (this node will not be returned if the wired matrix pickup is not supported, and it
```
```
is valid only when the audio input type is "Linein"), attr:opt{opt, string}-->false
```
</matrixPickUp>
<isSupportRestore>
<!--ro, opt, bool, whether the device supports restoring audio parameters of the two-way audio channel, desc:corresponding API:
/ISAPI/System/TwoWayAudio/channels/<twoWayAudioChannelID>/restore?format=json-->true
</isSupportRestore>
</TwoWayAudioChannel>
</TwoWayAudioChannelList>
```
12.5 Access Control (General)
```
12.5.1 Access Control Event Management
Hikvision co MMC
adil@hikvision.co.az
Request URL
GET /ISAPI/AccessControl/AcsEvent/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"AcsEvent": {
```
/*ro, req, object, access control events*/
```
"AcsEventCond": {
```
/*ro, opt, object, search conditions*/
```
"searchID": {
```
/*ro, req, object, search ID, it is used to check whether the current search requester is the same as the previous one. If they are the same,
the search record will be stored in the device to speed up the next search*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"searchResultPosition": {
```
/*ro, req, object, the start position of the search result in the result list*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"maxResults": {
```
/*ro, req, object, the maximum number of search results that can be obtained by calling this URL*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"major": {
```
```
/*ro, opt, object, major alarm type (the type value should be transformed to the decimal number)*/
```
"@opt": "0,1,2,3,5"
/*ro, req, string, major type*/
```
},
```
```
"minorAlarm": {
```
```
/*ro, opt, object, minor alarm type (the type value should be transformed to the decimal number)*/
```
"@opt": "1024,1025,1026,1027…"
/*ro, req, string, minor alarm type*/
```
},
```
```
"minorException": {
```
```
/*ro, opt, object, minor exception type (the type value should be transformed to the decimal number)*/
```
"@opt": "39,58,59,1024…"
/*ro, req, string, minor exception type*/
```
},
```
```
"minorOperation": {
```
```
/*ro, opt, object, minor operation type (the type value should be transformed to the decimal number)*/
```
"@opt": "80,90,112,113…"
/*ro, req, string, minor operation type*/
```
},
```
```
"minorEvent": {
```
```
/*ro, opt, object, minor event type (the type value should be transformed to the decimal number)*/
```
"@opt": "1,2,3,4…"
/*ro, req, string, minor event type*/
```
},
```
```
"startTime": {
```
/*ro, opt, object, start time*/
"@min": 0,
/*ro, req, int, the minimum value, range:[0,32]*/
"@max": 32
/*ro, req, int, the maximum value, range:[0,32]*/
```
},
```
```
"endTime": {
```
/*ro, opt, object, end time*/
"@min": 0,
/*ro, req, int, the minimum value, range:[0,32]*/
"@max": 32
/*ro, req, int, the maximum value, range:[0,32]*/
```
},
```
```
"cardNo": {
```
/*ro, opt, object, card No.*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"name": {
```
/*ro, opt, object, name of the card holder*/
12.5.1.1 Get the capability of searching for access control events
Hikvision co MMC
adil@hikvision.co.az
/*ro, opt, object, name of the card holder*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
"picEnable": "true,false",
/*ro, opt, string, whether to include pictures*/
```
"beginSerialNo": {
```
/*ro, opt, object, start serial No.*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"endSerialNo": {
```
/*ro, opt, object, end serial No.*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"employeeNoString": {
```
/*ro, opt, object, employee No.*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
},
```
```
"InfoList": {
```
/*ro, opt, object, information list*/
"maxSize": 10,
/*ro, opt, int, the maximum value*/
```
"time": {
```
```
/*ro, opt, object, time (UTC time)*/
```
"@min": 0,
/*ro, req, int, the minimum value, range:[0,32]*/
"@max": 32
/*ro, req, int, the maximum value, range:[0,32]*/
```
},
```
```
"netUser": {
```
/*ro, opt, object, user name*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"remoteHostAddr": {
```
/*ro, opt, object, remote host address*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"cardNo": {
```
/*ro, opt, object, card No.*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"cardType": {
```
/*ro, opt, object, card type*/
"@opt": "1,2,3,4,5,6,7,8"
```
/*ro, req, string, 1 (normal card), 2 (disability card), 3 (blocklist card), 4 (patrol card), 5 (duress card), 6 (super card), 7 (visitor
```
```
card), 8 (dismiss card)*/
```
```
},
```
```
"cardReaderNo": {
```
/*ro, opt, object, card reader No.*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"doorNo": {
```
```
/*ro, opt, object, door (floor) No.*/
```
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"employeeNo": {
```
```
/*ro, opt, object, employee No. (person ID)*/
```
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"serialNo": {
```
/*ro, opt, object, event serial No.*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
Hikvision co MMC
adil@hikvision.co.az
/*ro, req, int, the maximum value*/
```
},
```
```
"userType": {
```
/*ro, opt, object, person types*/
"@opt": "normal,visitor,blackList,administrators"
```
/*ro, req, string, "normal" (normal person (household)), "visitor" (visitor), "blacklist" (person in blocklist), "administrators"
```
```
(administrator)*/
```
```
},
```
```
"currentVerifyMode": {
```
/*ro, opt, object, current authentication mode of the card reader*/
"@opt":
"cardAndPw,card,cardOrPw,fp,fpAndPw,fpOrCard,fpAndCard,fpAndCardAndPw,faceOrFpOrCardOrPw,faceAndFp,faceAndPw,faceAndCard,face,employeeNoAndPw,fpOrPw,employe
eNoAndFp,employeeNoAndFpAndPw,faceAndFpAndCard,faceAndPwAndFp,employeeNoAndFace,faceOrfaceAndCard,fpOrface,cardOrfaceOrPw,iris,faceOrFpOrCardOrPwOrIris,face
OrCardOrPwOrIris"
/*ro, req, string, "cardAndPw"-card+password, "card", "cardOrPw"-card or password, "fp"-fingerprint, "fpAndPw"-fingerprint+password,
"fpOrCard"-fingerprint or card, "fpAndCard"-fingerprint+card, "fpAndCardAndPw"-fingerprint+card+password, "faceOrFpOrCardOrPw"-face or fingerprint or card
or password, "faceAndFp"-face+fingerprint, "faceAndPw"-face+password, "faceAndCard"-face+card, "face", "employeeNoAndPw"-employee No.+password, "fpOrPw"-
fingerprint or password, "employeeNoAndFp"-employee No.+fingerprint, "employeeNoAndFpAndPw"-employee No.+fingerprint+password, "faceAndFpAndCard"-
face+fingerprint+card, "faceAndPwAndFp"-face+password+fingerprint, "employeeNoAndFace"-employee No.+face, "faceOrfaceAndCard"-face or face+card, "fpOrface"-
fingerprint or face, "cardOrfaceOrPw"-card or face or password, "cardOrFpOrPw"-card or fingerprint or password*/
```
},
```
```
"QRCodeInfo": {
```
/*ro, opt, object, QR code information*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"thermometryUnit": {
```
/*ro, opt, object, temperature unit*/
"@opt": ["celsius", "fahrenheit", "kelvin"]
```
/*ro, req, array, "celsius" (Celsius (default)), "fahrenheit" (Fahrenheit), "kelvin" (Kelvin), subType:string*/
```
```
},
```
```
"currTemperature": {
```
/*ro, opt, object, skin-surface temperature*/
"@min": 1,
/*ro, req, int, skin-surface temperature, which is accurate to one decimal place*/
"@max": 1
/*ro, req, int, skin-surface temperature, which is accurate to one decimal place*/
```
},
```
```
"isAbnomalTemperature": {
```
/*ro, opt, object, whether the skin-surface temperature is abnormal*/
"@opt": [true, false]
```
/*ro, req, array, whether the skin-surface temperature is abnormal (true-yes), subType:bool*/
```
```
},
```
```
"RegionCoordinates": {
```
/*ro, opt, object, coordinates of the skin-surface temperature*/
```
"positionX": {
```
/*ro, opt, object, X-coordinate*/
"@min": 0,
/*ro, req, int, the minimum value, normalized X-coordinate which is between 0 and 1000*/
"@max": 1000
/*ro, req, int, the maximum value, normalized X-coordinate which is between 0 and 1000*/
```
},
```
```
"positionY": {
```
/*ro, opt, object, Y-coordinate*/
"@min": 0,
/*ro, req, int, the minimum value, normalized Y-coordinate which is between 0 and 1000*/
"@max": 1000
/*ro, req, int, the maximum value, normalized Y-coordinate which is between 0 and 1000*/
```
}
```
```
},
```
```
"mask": {
```
/*ro, opt, object, whether the person is wearing mask*/
"@opt": ["unknown", "yes", "no"]
/*ro, req, array, "unknown", "yes", "no", subType:string*/
```
},
```
```
"pictureURL": {
```
/*ro, opt, object, URL of the captured picture*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"attendanceStatus": {
```
```
/*ro, opt, object, attendance status, desc:"undefined", "checkIn" (check-in), "checkOut" (check-out), "breakOut" (start of break), "breakIn"
```
```
(end of break), "overtimeIn" (start of overtime), "overTimeOut" (end of overtime)*/
```
"@opt": "undefined,checkIn,checkOut,breakOut,breakIn,overtimeIn,overtimeOut"
/*ro, req, string, options*/
```
},
```
```
"label": {
```
/*ro, opt, object, self-defined attendance name*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"statusValue": {
```
/*ro, opt, object, status value*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
Hikvision co MMC
adil@hikvision.co.az
```
},
```
```
"helmet": {
```
/*ro, opt, object, whether the person is wearing hard hat, desc:"unknown", "yes", "no"*/
"@opt": "unknown,yes,no"
/*ro, req, string, options*/
```
},
```
```
"thermalPicUrl": {
```
/*ro, opt, object, URL of the thermal imaging picture*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"HealthInfo": {
```
/*ro, opt, object, health information*/
```
"healthCode": {
```
/*ro, opt, object, health code status*/
"@opt": [0, 1, 2, 3, 4, 5, 6, 7]
```
/*ro, req, array, options, subType:int, desc:0 (no request), 1 (no health code), 2 (green QR code), 3 (yellow QR code), 4 (red QR code),
```
```
5 (no such person), 6 (other error, e.g., searching failed due to API exception), 7 (searching for the health code timed out)*/
```
```
},
```
```
"NADCode": {
```
```
/*ro, opt, object, nucleic acid test result, desc:0 (no result), 1 (negative, which means normal), 2 (positive, which means diagnosed), 3
```
```
(the result has expired)*/
```
"@opt": [0, 1, 2, 3, 4]
/*ro, req, array, options, subType:int*/
```
},
```
```
"travelCode": {
```
```
/*ro, opt, object, trip code, desc:0 (no trip in the past 14 days), 1 (has left the current area left in the past 14 days), 2 (has been to
```
```
the high-risk area in the past 14 days), 3 (other)*/
```
"@opt": [0, 1, 2, 3, 4]
/*ro, req, array, options, subType:int*/
```
},
```
```
"travelInfo": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, req, int, step:1*/
"@max": 15
/*ro, req, int, step:1*/
```
},
```
```
"vaccineStatus": {
```
```
/*ro, opt, object, whether the person is vaccinated, desc:0 (not vaccinated), 1 (vaccinated)*/
```
"@opt": [0, 1, 2, 3, 4]
/*ro, req, array, options, subType:int*/
```
},
```
```
"vaccineNum": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, req, int, step:1*/
"@max": 3
/*ro, req, int, step:1*/
```
}
```
```
},
```
```
"FaceRect": {
```
/*ro, opt, object, rectangle frame for human face, desc:the origin is the upper-left corner of the screen*/
```
"height": {
```
/*ro, req, object, height*/
"@min": 0.000,
/*ro, req, float, the minimum value*/
"@max": 1.000
/*ro, req, float, the maximum value*/
```
},
```
```
"width": {
```
/*ro, req, object, width*/
"@min": 0.000,
/*ro, req, float, the minimum value*/
"@max": 1.000
/*ro, req, float, the maximum value*/
```
},
```
```
"x": {
```
/*ro, req, object, X-coordinate of the upper-left corner of the frame*/
"@min": 0.000,
/*ro, req, float, the minimum value*/
"@max": 1.000
/*ro, req, float, the maximum value*/
```
},
```
```
"y": {
```
/*ro, req, object, Y-coordinate of the upper-left corner of the frame*/
"@min": 0.000,
/*ro, req, float, the minimum value*/
"@max": 1.000
/*ro, req, float, the maximum value*/
```
}
```
```
},
```
```
"currentAuthenticationTimes": {
```
/*ro, req, object*/
"@min": 0,
/*ro, req, int*/
"@max": 255
/*ro, req, int*/
```
},
```
```
"allowAuthenticationTimes": {
```
/*ro, req, object*/
"@min": 0,
Hikvision co MMC
adil@hikvision.co.az
/*ro, req, int*/
"@max": 255
/*ro, req, int*/
```
}
```
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/AcsEvent/StorageCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"EventStorageCfgCap": {
```
/*ro, req, object, configuration capability of event storing*/
```
"mode": {
```
```
/*ro, req, object, event storage method, desc:"regular" (delete old events periodically), "time" (delete old events by specified time), "cycle"
```
```
(overwriting)*/
```
"@opt": ["regular", "time", "cycle"]
/*ro, opt, array, subType:string*/
```
},
```
```
"checkTime": {
```
/*ro, opt, object, check time, desc:this node is valid when mode is "time". Events that occurred before the check time will be deleted*/
"@min": 0,
/*ro, opt, int, the minimum value*/
"@max": 0
/*ro, opt, int, the maximum value*/
```
},
```
```
"period": {
```
/*ro, opt, object, time period for deleting old events, desc:this node is valid when mode is "regular"*/
"@min": 10,
/*ro, opt, int, the minimum value*/
"@max": 10
/*ro, opt, int, the maximum value*/
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/AcsEvent/StorageCfg?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"EventStorageCfg": {
```
/*ro, req, object*/
"mode": "regular",
```
/*ro, req, enum, event storage mode, subType:string, desc:"regular" (delete old events periodically), "time" (delete old events by specified time),
```
```
"cycle" (overwriting)*/
```
"checkTime": "1970-01-01 00:00:00",
/*ro, opt, string, check time. This node is required when the storage mode is "time"*/
"period": 10
/*ro, opt, int, time period for deleting old events. This node is required when the storage mode is "regular", unit:min, desc:unit: minute*/
```
}
```
```
}
```
12.5.1.2 Get the configuration capability of storing access control events
12.5.1.3 Get the storage parameters of access control events
12.5.1.4 Set storage parameters of access control events
Hikvision co MMC
adil@hikvision.co.az
Request URL
PUT /ISAPI/AccessControl/AcsEvent/StorageCfg?format=json
Query Parameter
None
Request Message
```
{
```
```
"EventStorageCfg": {
```
/*wo, req, object*/
"mode": "regular",
```
/*wo, req, enum, event storage method, subType:string, desc:"regular" (delete old events periodically), "time" (delete old events by specified
```
```
time), "cycle" (overwriting);*/
```
"checkTime": "1970-01-01 00:00:00",
```
/*wo, opt, string, check time; this node is valid when mode is "time"*/
```
"period": 10
```
/*wo, opt, int, time period for deleting old events; this node is valid when mode is "regular", unit:min, desc:time period for deleting old events;
```
this node is valid when mode is "regular"*/
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded); it is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node must be returned when the value of statusCode is not 1*/
```
}
```
Request URL
POST /ISAPI/AccessControl/AcsEvent?format=json
Query Parameter
None
Request Message
12.5.1.5 Search for access control events
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"AcsEventCond": {
```
/*req, object, access control events*/
"searchID": "test",
/*req, string, search ID, desc:it is used to check whether the current search requester is the same as the previous one. If they are the same, the
search record will be stored in the device to speed up the next search*/
"searchResultPosition": 0,
/*req, int, the start position of the search result in the result list:, desc:in a single search, if you cannot get all the records in the result
list, you can mark the end position and get the following records after the marked position in the next search. If the maximum number of totalMatches
```
supported by the device is M and the number of totalMatches stored in the device now is N (N<=M), the valid range of this node is 0 to N-1*/
```
"maxResults": 30,
/*req, int, the maximum number of search results, which is defined by the device capability, will be returned if the value of maxResults reaches the
limit, desc:if maxResults exceeds the range returned by the device capability, the device will return the maximum number of search results according to the
device capability and will not return error message*/
"major": 1,
```
/*req, int, major type, desc:the type value should be transformed to the decimal number; see Access Control Event Types for details*/
```
"minor": 1024,
```
/*req, int, minor type, desc:the type value should be transformed to the decimal number; see Access Control Event Types for details*/
```
"startTime": "1970-01-01T00:00:00+08:00",
```
/*opt, datetime, start time (UTC time)*/
```
"endTime": "1970-01-01T00:00:00+08:00",
```
/*opt, datetime, end time (UTC time)*/
```
"cardNo": "test",
/*opt, string, card No.*/
"name": "test",
/*opt, string, name of the card holder*/
"videoChannel": 1,
/*opt, int, video channel No., range:[1,86400], desc:this node is newly added to DeepinMind devices for attendance*/
"picEnable": true,
```
/*opt, bool, whether to upload the picture along with the event information, desc:false (no), true (yes, default value); (1. all matched events will
```
```
be uploaded without pictures; 2. all matched events will be uploaded with pictures if there are any; 3. if this node is not configured, the default value is
```
```
true)*/
```
"beginSerialNo": 1,
/*opt, int, start serial No.*/
"endSerialNo": 1,
/*opt, int, end serial No.*/
"employeeNoString": "test",
```
/*opt, string, employee No. (person ID)*/
```
"timeReverseOrder": true,
```
/*opt, bool, whether to return events in descending order of time (later events will be returned first), desc:true (yes), false or this node is not
```
```
returned (no)*/
```
"isAbnomalTemperature": true,
/*opt, bool, whether the skin-surface temperature is abnormal*/
"temperatureSearchCond": "all",
/*opt, enum, temperature search condition, subType:string, desc:when this node and isAbnormalTemperature both exist, isAbnormalTemperature is
```
invalid; "all" (event with temperature), "normal" (event with normal temperature), "abnormal" (event with abnormal temperature)*/
```
"isAttendanceInfo": true,
```
/*opt, bool, whether it contains attendance records, desc:this node is newly added to HEOP protocol; if this node is true, main type, minor type,
```
employee No., name, and time will be returned*/
"hasRecordInfo": true
/*opt, bool*/
```
}
```
```
}
```
Response Message
```
{
```
```
"AcsEvent": {
```
/*ro, req, object, access control events*/
"searchID": "test",
/*ro, req, string, search ID, it is used to check whether the current search requester is the same as the previous one. If they are the same, the
search record will be stored in the device to speed up the next search*/
"responseStatusStrg": "OK",
/*ro, req, string, searching status description*/
"numOfMatches": 1,
/*ro, req, int, number of results returned this time*/
"totalMatches": 1,
/*ro, req, int, total number of matched results*/
"InfoList": [
/*ro, opt, array, information list, subType:object*/
```
{
```
"major": 1,
/*ro, req, int, major alarm type*/
"minor": 1,
/*ro, req, int, minor alarm type*/
"time": "2016-12-12T17:30:08+08:00",
```
/*ro, req, string, time (UTC time)*/
```
"netUser": "test",
/*ro, opt, string, user name*/
"remoteHostAddr": "test",
/*ro, opt, string, remote host address*/
"videoChannel": 1,
/*ro, opt, int, video channel No., range:[1,86400], desc:this node is newly added to DeepinMind devices for attendance*/
"cardNo": "test",
/*ro, opt, string, card No.*/
"cardType": 1,
```
/*ro, opt, enum, card type, subType:int, desc:1 (normal card), 2 (disability card), 3 (blocklist card), 4 (patrol card), 5 (duress card), 6
```
```
(super card), 7 (visitor card), 8 (dismiss card)*/
```
"whiteListNo": 1,
Hikvision co MMC
adil@hikvision.co.az
/*ro, opt, int, allowlist No.*/
"reportChannel": 1,
/*ro, opt, int, channel type for uploading alarm/event*/
"cardReaderKind": 1,
```
/*ro, opt, int, card reader type: 1 (IC card reader)*/
```
"cardReaderNo": 1,
/*ro, opt, int, card reader No.*/
"doorNo": 1,
/*ro, opt, int, door or floor No.*/
"verifyNo": 1,
/*ro, opt, int, multi-factor authentication No.*/
"alarmInNo": 1,
/*ro, opt, int, alarm input No.*/
"alarmOutNo": 1,
/*ro, opt, int, alarm output No.*/
"caseSensorNo": 1,
/*ro, opt, int, event trigger No.*/
"RS485No": 1,
/*ro, opt, int, RS-485 channel No.*/
"multiCardGroupNo": 1,
/*ro, opt, int, group No.*/
"accessChannel": 1,
/*ro, opt, int, RS-485 channel No.*/
"deviceNo": 1,
/*ro, opt, int, device No.*/
"distractControlNo": 1,
/*ro, opt, int, distributed controller No.*/
"employeeNoString": "test",
```
/*ro, opt, string, employee No. (person ID)*/
```
"localControllerID": 1,
/*ro, opt, int, distributed controller No.*/
"InternetAccess": 1,
/*ro, opt, int, network interface No.*/
"type": 1,
```
/*ro, opt, int, zone type, desc:0 (instant alarm zone), 1 (24-hour zone), 2 (delayed zone), 3 (internal zone), 4 (key zone), 5 (fire alarm
```
```
zone), 6 (perimeter zone), 7 (24-hour silent zone), 8 (24-hour auxiliary zone), 9 (24-hour shock zone), 10 (emergency door open zone), 11 (emergency door
```
```
closed zone), 255 (none)*/
```
"MACAddr": "test",
/*ro, opt, string, MAC address*/
"swipeCardType": 1,
```
/*ro, opt, enum, card swiping type, subType:int, desc:0 (invalid), 1 (QR code)*/
```
"serialNo": 1,
/*ro, opt, int, event serial No.*/
"channelControllerID": 1,
/*ro, opt, int, lane controller ID*/
"channelControllerLampID": 1,
/*ro, opt, int, light board ID of lane controller, range:[1,255]*/
"channelControllerIRAdaptorID": 1,
/*ro, opt, int, IR adapter ID of lane controller, range:[1,255]*/
"channelControllerIREmitterID": 1,
/*ro, opt, int, active infrared intrusion detector No. of lane controller, range:[1,255]*/
"userType": "normal",
/*ro, opt, string, person type*/
"currentVerifyMode": "cardAndPw",
```
/*ro, opt, enum, current authentication mode of the card reader, subType:string, desc:"cardAndPw" (card + password); "card", "cardOrPw"
```
```
(card or password), "fp" (fingerprint), "fpAndPw" (fingerprint + password), "fpOrCard" "fingerprint or card", "fpAndCard" (fingerprint + card),
```
```
"fpAndCardAndPw" (fingerprint + card + password), "faceOrFpOrCardOrPw" (face or fingerprint or card or password), "faceAndFp" (face + fingerprint),
```
```
"faceAndPw" (face + password), "faceAndCard" (face + card), "face", "employeeNoAndPw" (emplyee No. +password), "fpOrPw" (fingerprint or password),
```
```
"employeeNoAndFp" (employee No. + fingerprint), "employeeNoAndFpAndPw" (employee No. + fingerprint + password), "faceAndFpAndCard" (face + fingerprint +
```
```
card), "faceAndPwAndFp" (face + password + fingerprint), "employeeNoAndFace" (employee No. + face), "faceOrfaceAndCard" (face or face + card), "fpOrface"
```
```
(fingerprint or face), "cardOrfaceOrPw" (card or face or password), "faceOrFpOrCardOrPwOrIris" (face or fingerprint or card or password or iris),
```
```
"faceOrCardOrPwOrIris" (face or card or password or iris), "sleep", "invalid"*/
```
"QRCodeInfo": "test",
/*ro, opt, string, QR code information*/
"thermometryUnit": "celsius",
```
/*ro, opt, enum, temperature unit, subType:string, desc:"celsius" (Celsius, default value), "fahrenheit" (Fahrenheit), "kelvin" (Kelvin)*/
```
"currTemperature": 36.5,
/*ro, opt, float, skin-surface temperature, which is accurate to one decimal place*/
"isAbnomalTemperature": true,
```
/*ro, opt, bool, whether the skin-surface temperature is abnormal (true-yes)*/
```
```
"RegionCoordinates": {
```
/*ro, opt, object, coordinates of the skin-surface temperature*/
"positionX": 254,
/*ro, opt, int, normalized X-coordinate which is between 0 and 1000*/
"positionY": 133
/*ro, opt, int, normalized Y-coordinate which is between 0 and 1000*/
```
},
```
"mask": "unknown",
/*ro, opt, enum, whether the person wears a mask, subType:string, desc:"unknown"*/
"pictureURL": "test",
/*ro, opt, string, picture URL*/
"filename": "picture1",
/*ro, opt, string, file name, desc:if multiple pictures are returned at a time, filename of each picture should be unique*/
"attendanceStatus": "undefined",
```
/*ro, opt, enum, attendance status, subType:string, desc:"undefined", "checkIn" (check-in), "checkOut" (check-out), "breakOut" (start of
```
```
break), "breakIn" (end of break), "overtimeIn" (start of overtime), "overTimeOut" (end of overtime)*/
```
"label": "test",
/*ro, opt, string, custom attendance name*/
"statusValue": 1,
/*ro, opt, int, status value*/
"helmet": "unknown",
/*ro, opt, enum, whether the person wears a hard hat, subType:string, desc:"unknown", "yes", "no"*/
"visibleLightPicUrl": "test",
/*ro, opt, string, visible light picture URL*/
Hikvision co MMC
adil@hikvision.co.az
/*ro, opt, string, visible light picture URL*/
"thermalPicUrl": "test",
/*ro, opt, string, URL of the thermal imaging picture*/
"appType": "attendance",
```
/*ro, opt, enum, application type, subType:string, desc:"attendance" (Time & Attendance module), "signIn" (Check-In module, which is only
```
```
used for FocSign products)*/
```
```
"HealthInfo": {
```
/*ro, opt, object, health information*/
"healthCode": 1,
```
/*ro, opt, enum, health code status, subType:int, desc:0 (no request), 1 (no health code), 2 (green QR code), 3 (yellow QR code), 4 (red
```
```
QR code), 5 (no such person), 6 (other error, e.g., searching failed due to API exception), 7 (searching for the health code timed out)*/
```
"NADCode": 1,
```
/*ro, opt, enum, nucleic acid test result, subType:int, desc:0 (no result), 1 (negative, which means normal), 2 (positive, which means
```
```
diagnosed), 3 (the result has expired)*/
```
"travelCode": 1,
```
/*ro, opt, enum, trip code, subType:int, desc:0 (no trip in the past 14 days), 1 (has left the current area in the past 14 days), 2 (has
```
```
been to the high-risk area in the past 14 days), 3 (other)*/
```
"travelInfo": "test",
/*ro, opt, string*/
"vaccineStatus": 1,
```
/*ro, opt, enum, whether the person is vaccinated, subType:int, desc:0 (not vaccinated), 1 (vaccinated)*/
```
"vaccineNum": 1
/*ro, opt, int, step:1*/
```
},
```
"meetingID": "test",
/*ro, opt, string, meeting ID*/
"PersonInfoExtends": [
/*ro, opt, array, additional person information, subType:object, desc:this node displays additional person information on the device*/
```
{
```
"id": 1,
/*ro, opt, int, extended ID of the additional person information, range:[1,32], desc:related URL:
```
/ISAPI/AccessControl/personInfoExtendName?format=json; this node is used for displaying the name of value; if ID does not exists, it starts from 1*/
```
"value": "test"
/*ro, opt, string, extended content of the additional person information*/
```
}
```
],
"name": "test",
/*ro, opt, string, name, desc:person name*/
```
"FaceRect": {
```
/*ro, opt, object, rectangle frame for human face, desc:the origin is the upper-left corner of the screen*/
"height": 1.000,
/*ro, req, float, height, range:[0.000,1.000]*/
"width": 1.000,
/*ro, req, float, width, range:[0.000,1.000]*/
"x": 0.000,
/*ro, req, float, X-coordinate of the upper-left corner of the frame, range:[0.000,1.000]*/
"y": 0.000
/*ro, req, float, Y-coordinate of the upper-left corner of the frame, range:[0.000,1.000]*/
```
},
```
```
"RecordInfo": {
```
/*ro, opt, object*/
"startTime": "1970-01-01T00:00:00+08:00",
/*ro, opt, datetime, recording start time*/
"endTime": "1970-01-01T00:00:00+08:00",
/*ro, opt, datetime, recording end time*/
```
"playbackURL": "rtsp://10.65.130.168:554/ISAPI/Streaming/tracks/201/?starttime=20190213T091134Z&amp;endtime=20190213T092116Z"
```
/*ro, opt, string, range:[0,256]*/
```
},
```
"currentAuthenticationTimes": 1,
/*ro, opt, int, range:[0,255], step:1*/
"allowAuthenticationTimes": 1
/*ro, opt, int, range:[0,255], step:1*/
```
}
```
]
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/AcsEventTotalNum/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"AcsEvent": {
```
/*ro, opt, object*/
```
"AcsEventTotalNumCond": {
```
/*ro, opt, object, search conditions*/
```
"major": {
```
/*ro, req, object, major alarm type*/
12.5.1.6 Get the capability of getting total number of access control events by specific conditions
Hikvision co MMC
adil@hikvision.co.az
/*ro, req, object, major alarm type*/
"@opt": "0,1,2,3,5"
/*ro, opt, string, major alarm type*/
```
},
```
```
"minorAlarm": {
```
/*ro, req, object, minor alarm type*/
"@opt": "1024,1025,1026,1027"
/*ro, opt, string, minor alarm type*/
```
},
```
```
"minorException": {
```
/*ro, req, object, minor exception type*/
"@opt": "39,58,59,1024"
/*ro, opt, string, minor exception type*/
```
},
```
```
"minorOperation": {
```
/*ro, req, object, minor operation type*/
"@opt": "80,90,112,113"
/*ro, opt, string, minor operation type*/
```
},
```
```
"minorEvent": {
```
/*ro, opt, object, minor event type*/
"@opt": "1,2,3,4"
/*ro, opt, string, minor event type*/
```
},
```
```
"startTime": {
```
/*ro, opt, object, start time*/
"@min": 1,
```
/*ro, opt, int, start time (UTC time)*/
```
"@max": 1
```
/*ro, opt, int, end time (UTC time)*/
```
```
},
```
```
"endTime": {
```
/*ro, opt, object, end time*/
"@min": 1,
```
/*ro, opt, int, start time (UTC time)*/
```
"@max": 1
```
/*ro, opt, int, end time (UTC time)*/
```
```
},
```
```
"cardNo": {
```
/*ro, opt, object, card No.*/
"@min": 1,
/*ro, opt, int, card No.*/
"@max": 32
/*ro, opt, int, card No.*/
```
},
```
```
"name": {
```
/*ro, opt, object, name of the card holder*/
"@min": 1,
/*ro, opt, int, name of the card holder*/
"@max": 32
/*ro, opt, int, name of the card holder*/
```
},
```
"picEnable": "true,false",
/*ro, opt, string*/
```
"beginSerialNo": {
```
/*ro, opt, object, start serial No.*/
"@min": 1,
/*ro, opt, int, start serial No.*/
"@max": 1
/*ro, opt, int, start serial No.*/
```
},
```
```
"endSerialNo": {
```
/*ro, opt, object, end serial No.*/
"@min": 1,
/*ro, opt, int, end serial No.*/
"@max": 1
/*ro, opt, int, end serial No.*/
```
},
```
```
"employeeNoString": {
```
```
/*ro, opt, object, employee No. (person ID)*/
```
"@min": 1,
```
/*ro, opt, int, employee No. (person ID)*/
```
"@max": 32
```
/*ro, opt, int, employee No. (person ID)*/
```
```
}
```
```
},
```
```
"totalNum": {
```
/*ro, req, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
}
```
```
}
```
```
}
```
Request URL
12.5.1.7 Get the total number of access control events by specific conditions
Hikvision co MMC
adil@hikvision.co.az
POST /ISAPI/AccessControl/AcsEventTotalNum?format=json
Query Parameter
None
Request Message
```
{
```
```
"AcsEventTotalNumCond": {
```
/*req, object*/
"major": 1,
```
/*req, int, major alarm type, desc:(the type value should be transformed to the decimal number), refer to Access Control Event Types for details*/
```
"minor": 1024,
```
/*req, int, sub type, step:1, desc:(the type value should be transformed to the decimal number),refer to Access Control Event Types for details*/
```
"startTime": "1970-01-01+08:00",
```
/*opt, date, start time (UTC time)*/
```
"endTime": "1970-01-01+08:00",
```
/*opt, date, end time (UTC time)*/
```
"cardNo": "test",
/*opt, string, card No.*/
"name": "test",
/*opt, string, name of the card holder*/
"picEnable": true,
/*opt, bool, whether to upload the picture along with the event information, desc:whether to contain pictures: "true"-yes,"false"-no*/
"beginSerialNo": 1,
/*opt, int, start serial No.*/
"endSerialNo": 100,
/*opt, int, end serial No.*/
"employeeNoString": "test"
```
/*opt, string, employee No. (person ID), range:[1,32]*/
```
```
}
```
```
}
```
Response Message
```
{
```
```
"AcsEventTotalNum": {
```
/*ro, req, object*/
"totalNum": 1,
/*ro, req, int, total number of events that match the search conditions*/
"existedEventNum": 1
/*ro, opt, int*/
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/ClearEventCardLinkageCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"ClearEventCardLinkageCfg": {
```
/*ro, opt, object, clear event and card linkage parameters*/
```
"ClearFlags": {
```
/*ro, opt, object*/
"eventCardLinkage": "true,false"
/*ro, req, string, event and card linkage parameters*/
```
}
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/ClearEventCardLinkageCfg?format=json
Query Parameter
12.5.1.8 Get the capability of clearing event and card linkage parameters
12.5.1.9 Clear event card linkage configurations
Hikvision co MMC
adil@hikvision.co.az
None
Request Message
```
{
```
```
"ClearEventCardLinkageCfg": {
```
/*req, object*/
```
"ClearFlags": {
```
/*opt, object*/
"eventCardLinkage": true
/*req, bool, whether to clear event and card linkage parameters*/
```
}
```
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded); it is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node must be returned when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/DeployInfo
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<DeployInfo xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, arming information, attr:version{req, string, protocolVersion}-->
```
<DeployList size="5">
```
<!--ro, opt, array, arming list, subType:object, attr:size{req, int}-->
```
<Content>
<!--ro, opt, object, subscribe to messages-->
<deployNo>
<!--ro, req, int, arming No.-->1
</deployNo>
<deployType>
<!--ro, req, enum, arming type, subType:int-->1
</deployType>
<protocolType>
```
<!--ro, opt, enum, protocol type, subType:string, dep:or,{$.DeployInfo.DeployList[*].Content.deployType,eq,2},
```
```
{$.DeployInfo.DeployList[*].Content.deployType,eq,3}, desc:"HTTP", "HTTPS"-->HTTP
```
</protocolType>
<ipAddr>
<!--ro, req, string, IP address-->test
</ipAddr>
<port>
<!--ro, opt, int, port No., range:[1,65535]-->1
</port>
<eventType>
<!--ro, opt, enum, subType:string-->AccessController
</eventType>
</Content>
</DeployList>
</DeployInfo>
Request URL
12.5.1.10 Getting arming information
12.5.1.11 Getting arming information capability
Hikvision co MMC
adil@hikvision.co.az
GET /ISAPI/AccessControl/DeployInfo/capabilities
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<DeployInfo xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, arming Information, attr:version{req, string, protocolVersion}-->
```
<DeployList size="5">
```
<!--ro, opt, array, arming list, subType:object, attr:size{req, int}-->
```
<Content>
<!--ro, opt, object-->
<deployNo min="1" max="10">
```
<!--ro, req, int, arming No., attr:min{req, int},max{req, int}-->1
```
</deployNo>
<deployType opt="0,1,2,3">
```
<!--ro, req, int, arming type, attr:opt{req, string}-->1
```
</deployType>
<protocolType opt="HTTP,HTTPS">
```
<!--ro, opt, enum, protocol type, subType:string, attr:opt{req, string}, desc:"HTTP", "HTTPS"-->HTTP
```
</protocolType>
<ipAddr min="1" max="10">
```
<!--ro, req, string, IP address, attr:min{req, int},max{req, int}-->test
```
</ipAddr>
<port min="0" max="10">
```
<!--ro, opt, int, port No., range:[1,65535], attr:min{req, int},max{req, int}-->1
```
</port>
<eventType opt="AccessController,Consumer,AccessControllerAndConsumer">
```
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->AccessController
```
</eventType>
</Content>
</DeployList>
</DeployInfo>
Request URL
PUT /ISAPI/AccessControl/EventCardLinkageCfg/<ACEID>?format=json
Query Parameter
Parameter Name Parameter Type Description
ACEID string --
Request Message
```
{
```
```
"EventCardLinkageCfg": {
```
/*req, object, event card linkage parameters*/
"proMode": "event",
```
/*req, enum, linkage type, subType:string, desc:"event” (event linkage), "card” (card linkage), "mac" (MAC address linkage), "employee” (employee
```
```
No., i.e., person ID)*/
```
```
"EmployeeInfo": {
```
```
/*opt, object, employee No. (person ID) linkage parameters, desc:it is valid when proMode is "employee”*/
```
"employeeNo": "test"
```
/*opt, string, employee No. (person ID)*/
```
```
},
```
"eventSourceID": 1,
```
/*opt, int, event source ID, desc:it is valid when proMode is "event". For device event (mainEventType is 0), this field is invalid; for access
```
```
control point event (mainEventType is 2), this field refers to the access control point No.; for authentication unit event (mainEventType is 3), this field
```
```
refers to the authentication unit No.; for alarm input event (mainEventType is 1), this field refers to the zone alarm input ID or the event alarm input ID
```
65535-all*/
"alarmout": [1, 3, 5],
```
/*opt, array, linked alarm output No., subType:int, desc:[1,3,5]: 1-linked alarm output No.1; 3-linked alarm output No.3; 5-linked alarm output
```
No.5*/
"openDoor": [1, 3, 5],
/*opt, array, linked door No. to open, subType:int, desc:[1,3,5]: 1-linked door No.1, 3-linked door No.3, 5-linked door No.5*/
"mainDevBuzzer": true,
```
/*opt, bool, whether to enable buzzer linkage of the access controller (start buzzing):, desc:false-no, true-yes*/
```
"recordVideo": true,
/*opt, bool, whether to enable recording linkage, desc:false-no, true-yes*/
```
}
```
```
}
```
12.5.1.12 Set the event card linkage parameters
Hikvision co MMC
adil@hikvision.co.az
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": "test",
/*ro, opt, string, status code*/
"statusString": "test",
/*ro, opt, string, status description*/
"subStatusCode": "test",
/*ro, opt, string, sub status code*/
"errorCode": 1,
/*ro, req, int, error code*/
"errorMsg": "ok"
/*ro, req, string, error description*/
```
}
```
Request URL
GET /ISAPI/AccessControl/EventCardLinkageCfg/<ACEID>?format=json&filterValidFloor=<filterValidFloor>
Query Parameter
Parameter
Name
Parameter
Type Description
ACEID string --
filterValidFloor string
```
"filterValidFloor" (filter by the maximum number of valid floors), and if this parameter
```
does not exist, it is false by default and indicates returning the maximum number of
floors supported by the device.
Request Message
None
Response Message
12.5.1.13 Get the event and card linkage configuration parameters
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"EventCardLinkageCfg": {
```
/*ro, req, object*/
"proMode": "event",
/*ro, req, enum, linkage type, subType:string, desc:"event"-event linkage, "card"-card linkage, "mac"-MAC address linkage, "employee"-employee No.
```
(person ID)*/
```
```
"EventLinkageInfo": {
```
```
/*ro, opt, object, event linage parameters, dep:and,{$.EventCardLinkageCfg.proMode,eq,event}*/
```
"mainEventType": 0,
```
/*ro, req, enum, major event type, subType:int, desc:0-device event,1-alarm input event,2-access control point event,3-authentication unit (card
```
```
reader, fingerprint module) event*/
```
"subEventType": 54
/*ro, req, int, event sub type, desc:minor event type,refer to Event Linkage Types for details*/
```
},
```
```
"EmployeeInfo": {
```
```
/*ro, opt, object, employee No. (person ID) linkage parameters, dep:and,{$.EventCardLinkageCfg.proMode,eq,employee}*/
```
"employeeNo": "test"
```
/*ro, req, string, employee No. (person ID), range:[1,32]*/
```
```
},
```
"eventSourceID": 1,
```
/*ro, opt, int, event source ID, dep:or,{$.EventCardLinkageCfg.proMode,eq,event},{$.EventCardLinkageCfg.proMode,eq,card},
```
```
{$.EventCardLinkageCfg.proMode,eq,employee}, desc:it is valid when proMode is "event",65535-all. For device event (mainEventType is 0),this field is
```
```
invalid; for access control point event (mainEventType is 2),this field refers to the access control point No.; for authentication unit event (mainEventType
```
```
is 3,this field refers to the authentication unit No.; for alarm input event (mainEventType is 1),this field refers to the zone alarm input ID or the event
```
alarm input ID*/
"alarmout": [1, 3, 5],
```
/*ro, opt, array, linked alarm output No., subType:int, desc:[1,3,5]: 1-linked alarm output No.1; 3-linked alarm output No.3; 5-linked alarm output
```
No.5*/
"openDoor": [1, 3, 5],
```
/*ro, opt, array, linked door No. to open, subType:int, desc:[1,3,5]: 1-linked door No.1; 3-linked door No.3; 5-linked door No.5*/
```
"closeDoor": [1, 3, 5],
```
/*ro, opt, array, linked door No. to close, subType:int, desc:[1,3,5]: 1-linked door No.1; 3-linked door No.3; 5-linked door No.5*/
```
"alwaysOpen": [1, 3, 5],
```
/*ro, opt, array, linked door No. to remain unlocked, subType:int, desc:e.g.,[1,3,5]: 1-linked door No.1; 3-linked door No.3; 5-linked door No.5*/
```
"alwaysClose": [1, 3, 5],
```
/*ro, opt, array, linked door No. to remain locked, subType:int, desc:[1,3,5]: 1-linked door No.1; 3-linked door No.3; 5-linked door No.5*/
```
"capturePic": true,
/*ro, opt, bool, whether to enable capture linkage, desc:"false"-no, "true"-yes*/
"alarmOutClose": [1, 3, 5],
/*ro, opt, array, linked alarm output No. to disable, subType:int, desc:[1,3,5]: 1-alarm output No.1, 3-alarm output No.3,5-alarm output No.5*/
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/EventCardLinkageCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"EventCardLinkageCfg": {
```
/*ro, req, object, parameters of the event and card linkage*/
```
"eventID": {
```
/*ro, opt, object, event ID*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"proMode": {
```
/*ro, req, object, linkage type*/
"@opt": "event,card,mac,employee"
/*ro, opt, string, linkage method*/
```
},
```
```
"EventLinkageInfo": {
```
/*ro, opt, object, event linkage information*/
```
"mainEventType": {
```
/*ro, opt, object, event main type*/
"@opt": "0,1,2,3"
/*ro, opt, string, event main type*/
```
},
```
```
"devSubEventType": {
```
/*ro, opt, object, minor event type*/
"@opt": "0,1,2,3,54…"
/*ro, opt, string, minor event type*/
```
},
```
```
"alarmSubEventType": {
```
/*ro, opt, object, minor type of alarm input event*/
12.5.1.14 Get the configuration capability of the event and card linkage
Hikvision co MMC
adil@hikvision.co.az
/*ro, opt, object, minor type of alarm input event*/
"@opt": "0,1,2,3,52…"
/*ro, opt, string, minor type of alarm input event*/
```
},
```
```
"doorSubEventType": {
```
/*ro, opt, object, minor type of access control point event*/
"@opt": "0,1,2,3…"
/*ro, opt, string, minor type of access control point event*/
```
},
```
```
"cardReaderSubEventType": {
```
/*ro, opt, object, minor type of authentication unit event*/
"@opt": "0,1,2,3…"
/*ro, opt, string, minor type of authentication unit event*/
```
}
```
```
},
```
```
"CardNoLinkageInfo": {
```
/*ro, opt, object, card linkage parameters*/
```
"cardNo": {
```
/*ro, opt, object, card No.*/
"@min": 1,
/*ro, opt, int*/
"@max": 32
/*ro, opt, int*/
```
}
```
```
},
```
```
"MacAddrLinkageInfo": {
```
/*ro, opt, object, MAC address linkage parameters*/
```
"MACAddr": {
```
/*ro, opt, object, physical MAC address*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
}
```
```
},
```
```
"EmployeeInfo": {
```
/*ro, opt, object, person ID*/
```
"employeeNo": {
```
/*ro, opt, object, person ID*/
"@min": 1,
```
/*ro, opt, int, employee No. (person ID)*/
```
"@max": 32
/*ro, opt, int*/
```
}
```
```
},
```
```
"eventSourceID": {
```
/*ro, opt, object, event source ID*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"alarmout": {
```
/*ro, opt, object, linked alarm output No.*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
"ReaderAlarmout": [
/*ro, opt, array, subType:object*/
```
{
```
"readerID": 1,
/*ro, opt, int, card reader No., range:[1,8]*/
```
"alarmOut": {
```
/*ro, opt, object*/
"@size": 5,
/*ro, opt, int, range:[0,5]*/
"@min": 1,
/*ro, opt, int, range:[1,5]*/
"@max": 5
/*ro, opt, int, range:[1,5]*/
```
},
```
```
"alarmOutClose": {
```
/*ro, opt, object, array,linked alarm output No.*/
"@size": 5,
/*ro, opt, int, range:[0,5]*/
"@min": 1,
/*ro, opt, int, range:[1,5]*/
"@max": 5
/*ro, opt, int, range:[1,5]*/
```
}
```
```
}
```
],
```
"openDoor": {
```
/*ro, opt, object, linked door No. to open*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"closeDoor": {
```
/*ro, opt, object, linked door No. to close*/
"@min": 1,
Hikvision co MMC
adil@hikvision.co.az
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"alwaysOpen": {
```
/*ro, opt, object, array,linked door No. to remain unlocked*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"alwaysClose": {
```
/*ro, opt, object, linked door No. to remain locked*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
"mainDevBuzzer": "true,false",
/*ro, opt, string, buzzer linkage of the access controller*/
"capturePic": "true,false",
/*ro, opt, string, whether to enable capture linkage*/
```
"readerCapturePic": {
```
/*ro, opt, object*/
"@size": 8,
/*ro, opt, int, range:[0,8]*/
"@min": 1,
/*ro, opt, int, range:[1,8]*/
"@max": 8,
/*ro, opt, int, range:[1,8]*/
"@opt": [1, 4]
/*ro, opt, array, subType:int*/
```
},
```
"recordVideo": "true,false",
/*ro, opt, string, whether to enable recording linkage*/
```
"readerRecordVideo": {
```
/*ro, opt, object*/
"@size": 8,
/*ro, opt, int, range:[0,8]*/
"@min": 1,
/*ro, opt, int, range:[1,8]*/
"@max": 8,
/*ro, opt, int, range:[1,8]*/
"@opt": [1, 4]
/*ro, opt, array, subType:int*/
```
},
```
"mainDevStopBuzzer": "true,false",
```
/*ro, opt, string, whether to enable buzzer linkage of the access controller (stop buzzing): "false"-no,"true"-yes*/
```
```
"audioSourceType": {
```
/*ro, opt, object*/
"@opt": ["TTS", "customFile", "none"]
/*ro, opt, array, subType:string*/
```
},
```
```
"audioDisplayTTSLanguage": {
```
/*ro, opt, object*/
"@opt": ["SimChinese", "English"]
/*ro, req, array, subType:string*/
```
},
```
```
"audioDisplayTTS": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 64
/*ro, opt, int*/
```
},
```
```
"customAudioID": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 65535
/*ro, opt, int*/
```
},
```
```
"audioDisplayMode": {
```
/*ro, opt, object, linked audio announcement mode*/
"@opt": "close,single,loop"
/*ro, opt, string, linked audio announcement mode*/
```
},
```
```
"readerBuzzer": {
```
/*ro, opt, object, linked buzzer*/
"@min": 1,
/*ro, opt, int*/
"@max": 1,
/*ro, opt, int*/
"@opt": [1, 4]
/*ro, opt, array, subType:int*/
```
},
```
```
"alarmOutClose": {
```
/*ro, opt, object, array,linked alarm output No.*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
Hikvision co MMC
adil@hikvision.co.az
```
"alarmInSetup": {
```
/*ro, opt, object, linked zone No. to arm*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"alarmInClose": {
```
/*ro, opt, object, linked zone No. to disarm*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"readerStopBuzzer": {
```
/*ro, opt, object, linked buzzer No. to stop buzzing*/
"@min": 1,
/*ro, opt, int*/
"@max": 1,
/*ro, opt, int*/
"@opt": [1, 4]
/*ro, opt, array, subType:int*/
```
},
```
```
"duration": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, opt, int, unit:s*/
"@max": 30,
/*ro, opt, int, unit:s*/
"@def": 15
/*ro, opt, int, unit:s*/
```
},
```
```
"eventCardLinkageName": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int, unit:Byte*/
"@max": 128
/*ro, opt, int, unit:Byte*/
```
},
```
```
"FireMatrixEventSourceList": {
```
```
/*ro, opt, object, dep:and,{$.EventCardLinkageCfg.EventLinkageInfo.subEventType,eq,52}*/
```
"@size": 32,
/*ro, opt, int*/
```
"IoTChannelID": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 256
/*ro, opt, int, the maximum value*/
```
},
```
```
"channels": {
```
/*ro, opt, object*/
"@size": 20,
/*ro, opt, int*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
}
```
```
},
```
```
"Operations": {
```
/*ro, opt, object*/
```
"eventSourceID": {
```
```
/*ro, opt, object, event source ID,it is valid when proMode is "event",65535-all. For device event (mainEventType is 0),this field is invalid;
```
```
for access control point event (mainEventType is 2),this field refers to the access control point No.; for authentication unit event (mainEventType is
```
```
3,this field refers to the authentication unit No.; for alarm input event (mainEventType is 1),this field refers to the zone alarm input ID or the event
```
alarm input ID*/
"@min": 1,
/*ro, opt, int*/
"@max": 128
/*ro, opt, int*/
```
},
```
```
"TerminalsInfoCap": {
```
/*ro, opt, object, terminal list*/
"size": 1024,
/*ro, opt, int*/
```
"terminalID": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 1024
/*ro, opt, int*/
```
},
```
"isSupportACPChannel": true
/*ro, opt, bool*/
```
},
```
```
"audioSource": {
```
/*ro, opt, object*/
"@opt": ["audioFile", "speechSynthesis"]
/*ro, opt, array, subType:string*/
```
},
```
```
"materialId": {
```
/*ro, opt, object*/
"size": 32,
Hikvision co MMC
adil@hikvision.co.az
"size": 32,
/*ro, opt, int*/
"@min": 1,
/*ro, opt, int*/
"@max": 128
/*ro, opt, int*/
```
},
```
```
"speechSynthesisContent": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, opt, int, unit:Byte*/
"@max": 4096
/*ro, opt, int, unit:Byte*/
```
},
```
```
"voiceType": {
```
/*ro, opt, object*/
"@opt": ["male", "female"]
/*ro, opt, array, subType:string*/
```
},
```
```
"audioLevel": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, opt, int*/
"@max": 15
/*ro, opt, int*/
```
},
```
```
"audioVolume": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, opt, int*/
"@max": 15
/*ro, opt, int*/
```
},
```
```
"playMode": {
```
/*ro, opt, object*/
"@opt": ["order", "duration"]
/*ro, opt, array, subType:string*/
```
},
```
```
"duration": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, opt, int, unit:s*/
"@max": 3000
/*ro, opt, int, unit:s*/
```
}
```
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/EventOptimizationCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"EventOptimizationCfg": {
```
/*ro, opt, object*/
"enable": "true,false",
/*ro, opt, string, whether to enable event optimization*/
"isCombinedLinkageEvents": "true,false"
/*ro, opt, string, whether to enable linked event combination*/
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/EventOptimizationCfg?format=json
Query Parameter
None
12.5.1.15 Get the configuration capability of event optimization
12.5.1.16 Set the event optimization parameters
Hikvision co MMC
adil@hikvision.co.az
Request Message
```
{
```
```
"EventOptimizationCfg": {
```
/*opt, object*/
"enable": true,
/*opt, bool, whether to enable event optimization*/
"isCombinedLinkageEvents": true
/*opt, bool, whether to enable linked event combination*/
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": "test",
/*ro, opt, string, status code*/
"statusString": "test",
/*ro, opt, string, status description*/
"subStatusCode": "test",
/*ro, opt, string, sub status code*/
"errorCode": 1,
/*ro, req, int, error code*/
"errorMsg": "ok"
/*ro, req, string, error details*/
```
}
```
Request URL
GET /ISAPI/AccessControl/EventOptimizationCfg?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"EventOptimizationCfg": {
```
/*ro, opt, object*/
"enable": true,
/*ro, opt, bool, whether to enable event optimization*/
"isCombinedLinkageEvents": true
/*ro, opt, bool, whether to enable linked event combination*/
```
}
```
```
}
```
```
EventType:AccessControllerEvent
```
```
{
```
"ipAddress": "172.6.64.7",
/*ro, req, string, IPv4 address of the device that triggers the alarm*/
"ipv6Address": "1080:0:0:0:8:800:200C:417A",
/*ro, opt, string, IPv6 address of the device that triggers the alarm*/
"portNo": 80,
/*ro, opt, int, communication port No. of the device that triggers the alarm*/
"protocol": "HTTP",
/*ro, opt, enum, transmission communication protocol type, subType:string, desc:when ISAPI protocol is transmitted via HCNetSDK, the channel No. is the
video channel No. of private protocol. When ISAPI protocol is transmitted via EZ protocol, the channel No. is the video channel No. of EZ protocol. When
ISAPI protocol is transmitted via ISUP, the channel No. is the video channel No. of ISUP*/
"macAddress": "01:17:24:45:D9:F4",
/*ro, opt, string, MAC address*/
"channelID": 1,
/*ro, opt, int, channel No. of the device that triggers the alarm, desc:when ISAPI protocol is transmitted via HCNetSDK, the channel No. is the video
channel No. of private protocol. When ISAPI protocol is transmitted via EZ protocol, the channel No. is the video channel No. of EZ protocol. When ISAPI
protocol is transmitted via ISUP, the channel No. is the video channel No. of ISUP*/
"dateTime": "2004-05-03T17:30:08+08:00",
/*ro, req, datetime, alarm trigger time*/
"activePostCount": 1,
/*ro, req, int, times that the same alarm has been uploaded, desc:times that the same alarm has been uploaded*/
"eventType": "AccessControllerEvent",
12.5.1.17 Get the event optimization configuration parameters
12.5.1.18 Access control event
Hikvision co MMC
adil@hikvision.co.az
"eventType": "AccessControllerEvent",
```
/*ro, req, string, event type, desc:"AccessControllerEvent" (access control event)*/
```
"eventState": "active",
```
/*ro, req, enum, event status, subType:string, desc:for durative event: "active" (valid event or event starts), "inactive" (invalid event or the event
```
```
ends). For the heartbeat, the node value indicates the heartbeat data, and it is uploaded every 10 seconds*/
```
"eventDescription": "AccessControllerEvent",
```
/*ro, req, string, event description, desc:"AccessControllerEvent" (access control event)*/
```
"deviceID": "test0123",
```
/*ro, opt, string, device ID (PUID), desc:this node must be returned when ISAPI event information is transmitted via ISUP*/
```
```
"AccessControllerEvent": {
```
/*ro, req, object, access control event information*/
"deviceName": "test",
/*ro, opt, string, device name*/
"majorEventType": 1,
```
/*ro, req, int, major alarm type, desc:the type value should be transformed to the decimal number; see Access Control Alarm Types for details*/
```
"subEventType": 1,
```
/*ro, req, int, minor alarm type, desc:the type value should be transformed to the decimal number; see Access Control Alarm Types for details*/
```
"inductiveEventType": "authenticated",
```
/*ro, opt, enum, inductive event type, subType:string, desc:this node is used by storage devices; for access control devices, this node is invalid;
```
"authenticated", "authenticationFailed", "openingDoor", "closingDoor", "doorException", "remoteOperation", "timeSynchronization", "deviceException",
```
"deviceRecovered", "alarmTriggered", "alarmRecovered" (arming restoring event), "callCenter"*/
```
"netUser": "test",
/*ro, opt, string, user name for network operations*/
"remoteHostAddr": "test",
/*ro, opt, string, remote host address*/
"cardNo": "test",
/*ro, opt, string, card No.*/
"cardType": 1,
```
/*ro, opt, enum, card type, subType:int, desc:1 (normal card), 2 (disability card), 3 (blocklist card), 4 (patrol card), 5 (duress card), 6 (super
```
```
card), 7 (visitor card), 8 (dismiss card)*/
```
"name": "test",
/*ro, opt, string, person name*/
"sex": "male",
/*ro, opt, enum, subType:string, desc:"male", "female"*/
"whiteListNo": 1,
/*ro, opt, int, allowlist No.*/
"reportChannel": 1,
```
/*ro, opt, enum, channel type for uploading alarms/events, subType:int, desc:1 (uploading in arming mode), 2 (uploading by central group 1), 3
```
```
(uploading by central group 2)*/
```
"cardReaderKind": 1,
```
/*ro, opt, enum, card reader type, subType:int, desc:1 (IC card reader), 2 (ID card reader), 3 (QR code scanner), 4 (fingerprint module)*/
```
"cardReaderNo": 1,
/*ro, opt, int, card reader No., step:1, desc:card reader No.*/
"doorNo": 1,
```
/*ro, opt, int, door (floor) No.*/
```
"verifyNo": 1,
/*ro, opt, int, multiple authentication No.*/
"alarmInNo": 1,
/*ro, opt, int, alarm input No.*/
"alarmOutNo": 1,
/*ro, opt, int, alarm output No.*/
"caseSensorNo": 1,
/*ro, opt, int, event trigger No.*/
"RS485No": 1,
/*ro, opt, int, RS-485 channel No.*/
"multiCardGroupNo": 1,
/*ro, opt, int, group No.*/
"accessChannel": 1,
/*ro, opt, int, turnstile No.*/
"deviceNo": 1,
/*ro, opt, int, device No.*/
"distractControlNo": 1,
/*ro, opt, int, distributed access controller No.*/
"employeeNo": 1,
```
/*ro, opt, int, employee No. (person ID)*/
```
"employeeNoString": "test",
```
/*ro, opt, string, employee No. (person ID), desc:if the node employeeNo exists or the value of employeeNoString can be converted to that of
```
```
employeeNo, this node is required. For the upper-layer platform or client software, the node employeeNoString will be parsed in priority; if
```
employeeNoString is not configured, the node employeeNo will be parsed*/
"employeeName": "test",
/*ro, opt, string, person name, desc:this node is only used for FocSign products*/
"localControllerID": 1,
```
/*ro, opt, int, distributed access controller No., desc:0 (access controller), 1 to 64 (distributed access controller No. 1 to distributed access
```
```
controller No. 64)*/
```
"InternetAccess": 1,
```
/*ro, opt, enum, network interface No., subType:int, desc:1 (upstream network interface No. 1), 2 (upstream network interface No. 2), 3 (downstream
```
```
network interface No. 1)*/
```
"type": 1,
```
/*ro, opt, enum, zone type, subType:int, desc:0 (instant zone), 1 (24-hour zone), 2 (delayed zone), 3 (internal zone), 4 (key zone), 5 (fire alarm
```
```
zone), 6 (perimeter zone), 7 (24-hour silent zone), 8 (24-hour auxiliary zone), 9 (24-hour shock zone), 10 (emergency door open zone), 11 (emergency door
```
```
closed zone), 255 (none)*/
```
"MACAddr": "test",
/*ro, opt, string, MAC address*/
"swipeCardType": 1,
```
/*ro, opt, enum, card swiping types, subType:int, desc:0 (invalid), 1 (QR code)*/
```
"serialNo": 1,
/*ro, opt, int, event serial No., range:[1,100000], desc:it starts at 1 and each record increases by 1. It will be overwritten repeatedly when
reaching the maximum value supported by the device*/
"channelControllerID": 1,
```
/*ro, opt, enum, lane controller ID, subType:int, desc:1 (main lane controller), 2 (sub-lane controller)*/
```
"channelControllerLampID": 1,
/*ro, opt, int, light board ID of lane controller, range:[1,255]*/
"channelControllerIRAdaptorID": 1,
/*ro, opt, int, IR adaptor ID of the lane controller, range:[1,255]*/
Hikvision co MMC
adil@hikvision.co.az
/*ro, opt, int, IR adaptor ID of the lane controller, range:[1,255]*/
"channelControllerIREmitterID": 1,
/*ro, opt, int, active infrared intrusion detector No. of the lane controller, range:[1,255]*/
"userType": "normal",
```
/*ro, opt, enum, person type, subType:string, desc:"normal" (normal person (resident)), "visitor" (visitor), "blacklist" (person in the blocklist),
```
```
"administrators" (administrator)*/
```
"currentVerifyMode": "cardAndPw",
```
/*ro, opt, enum, current authentication mode of the card reader, subType:string, desc:"cardAndPw" (card+password), "card" (card), "cardOrPw" (card
```
```
or password), "fp" (fingerprint), "fpAndPw" (fingerprint+password), "fpOrCard" (fingerprint or card), "fpAndCard" (fingerprint+card), "fpAndCardAndPw"
```
```
(fingerprint+card+password), "faceOrFpOrCardOrPw" (face or fingerprint or card or password), "faceAndFp" (face+fingerprint), "faceAndPw" (face+password),
```
```
"faceAndCard" (face+card), "face" (face), "employeeNoAndPw" (employee No.+password), "fpOrPw" (fingerprint or password), "employeeNoAndFp" (employee
```
```
No.+fingerprint), "employeeNoAndFpAndPw" (employee No.+fingerprint+password), "faceAndFpAndCard" (face+fingerprint+card), "faceAndPwAndFp"
```
```
(face+password+fingerprint), "employeeNoAndFace" (employee No.+face), "faceOrfaceAndCard" (face or face+card), "fpOrface" (fingerprint or face),
```
```
"cardOrfaceOrPw" (card or face or password), "iris" (iris), "faceOrFpOrCardOrPwOrIris" (face, fingerprint, card, password, or iris), "faceOrCardOrPwOrIris"
```
```
(face, card, password, or iris)*/
```
"currentEvent": true,
/*ro, opt, bool, whether it is a real-time event*/
"QRCodeInfo": "test",
/*ro, opt, string, QR code information*/
"thermometryResult": "success",
/*ro, opt, enum, temperature screening result, subType:string, desc:"success", "fail"*/
"thermometryUnit": "celsius",
```
/*ro, opt, enum, temperature unit, subType:string, desc:"celsius" (Celsius, default value), "fahrenheit" (Fahrenheit), "kelvin" (Kelvin)*/
```
"currTemperature": 36.1,
/*ro, opt, float, skin-surface temperature, which is accurate to one decimal place*/
"isAbnomalTemperature": true,
/*ro, opt, bool, whether the skin-surface temperature is abnormal*/
```
"RegionCoordinates": {
```
/*ro, opt, object, coordinates of the skin-surface temperature*/
"positionX": 0,
/*ro, opt, int, normalized X-coordinate which is between 0 and 1000, range:[0,1000]*/
"positionY": 0
/*ro, opt, int, normalized Y-coordinate which is between 0 and 1000, range:[0,1000]*/
```
},
```
"remoteCheck": true,
```
/*ro, opt, bool, whether remote verification is required: true-yes, false-no (default)*/
```
"mask": "unknown",
/*ro, opt, enum, whether the person wears a mask, subType:string, desc:"unknown", "yes", "no"*/
"frontSerialNo": 1,
/*ro, opt, int, serial No. of the previous event, desc:if this node does not exist, the platform will check whether the event loss occurred
according to the node serialNo. If both the serialNo and frontSerialNo are returned, the platform will check whether the event loss occurred according to
both nodes. It is mainly used to solve the problem that the serialNo is inconsistent after subscribing events or alarms*/
"attendanceStatus": "checkIn",
```
/*ro, opt, enum, attendance status, subType:string, desc:"checkIn" (check-in), "checkOut" (check-out), "breakOut" (start of break), "breakIn" (end
```
```
of break), "overtimeIn" (start of overtime), "overTimeOut" (end of overtime)*/
```
"label": "test",
/*ro, opt, string, self-defined attendance name*/
"statusValue": 1,
/*ro, opt, int, status value*/
"pictureURL": "test",
/*ro, opt, string, URL of the captured picture, range:[0,256]*/
"visibleLightURL": "test",
/*ro, opt, string, visible light picture URL of the thermal imaging camera, range:[0,256]*/
"thermalURL": "test",
/*ro, opt, string, URL of the thermal picture, range:[0,256]*/
"faceBasemapURL": "test",
/*ro, opt, string, range:[0,256]*/
"picturesNumber": 1,
/*ro, opt, int, number of captured pictures*/
"unlockType": "password",
```
/*ro, opt, enum, unlocking type, subType:string, desc:this node is returned when the minor type is MINOR_UNCLOCK_RECORD; "password" (unlock by
```
```
password), "hijcking" (unlock by duress), "card" (unlock by card), "householder" (unlock by householder), "centerplatform" (unlock by management center),
```
```
"bluetooth" (unlock by bluetooth), "qrcode" (unlocked via QR code), "face" (unlock by recognizing face), "fingerprint" (unlock by fingerprint)*/
```
"classroomId": "test",
/*ro, opt, string, class ID*/
"classroomName": "test",
/*ro, opt, string, class name*/
"analysisModule": "signageApp",
```
/*ro, opt, enum, analysis module, subType:string, desc:this node is not returned, and the value is report via signage App; "signageApp" (signage
```
```
App), "faceSDK" (face picture SDK)*/
```
"customInfo": "test",
/*ro, opt, string, custom information*/
"helmet": "unknown",
/*ro, opt, enum, whether the person is wearing hard hat, subType:string, desc:"unknown", "yes", "no"*/
"purePwdVerifyEnable": true,
/*ro, opt, bool, whether the device supports opening the door only by password,
```
desc:opening the door only by password:
```
```
the password in authentication method is person password; checking the repetition of person password is not supported by the device, it should be
```
```
performed by the upper-layer platform; adding, deleting, editing, and searching for person password locally is not supported by the device*/
```
"appType": "attendance",
```
/*ro, opt, enum, application type (for FocSign products), subType:string, desc:"attendance" (Time & Attendance module), "signIn" (Check-In module)*/
```
```
"HealthInfo": {
```
/*ro, opt, object, health information*/
"healthCode": 1,
```
/*ro, opt, enum, health code status, subType:int, desc:0 (no request), 1 (no health code), 2 (green QR code), 3 (yellow QR code), 4 (red QR
```
```
code), 5 (no such person), 6 (other error, e.g., searching failed due to API exception), 7 (searching for the health code timed out)*/
```
"NADCode": 1,
```
/*ro, opt, enum, nucleic acid test result, subType:int, desc:0 (no result), 1 (negative, which means normal), 2 (positive, which means
```
```
diagnosed), 3 (the result has expired)*/
```
"NADMsg": "test",
/*ro, opt, string, range:[0,64]*/
"NADTime": 1,
/*ro, opt, enum, subType:int*/
"travelCode": 1,
```
/*ro, opt, enum, trip code, subType:int, desc:0 (no trip in the past 14 days), 1 (has left the current area left in the past 14 days), 2 (has
```
Hikvision co MMC
adil@hikvision.co.az
```
/*ro, opt, enum, trip code, subType:int, desc:0 (no trip in the past 14 days), 1 (has left the current area left in the past 14 days), 2 (has
```
```
been to the high-risk area in the past 14 days), 3 (other)*/
```
"travelInfo": "test",
/*ro, opt, string, trip information, desc:the empty string indicates that searching trip failed*/
"vaccineStatus": 1,
```
/*ro, opt, enum, whether the person is vaccinated, subType:int, desc:0 (not vaccinated), 1 (vaccinated)*/
```
"vaccineNum": 1,
/*ro, opt, int, step:1*/
"vaccineMsg": "test",
/*ro, opt, string, range:[0,64]*/
"ANTCode": 1,
/*ro, opt, enum, subType:int*/
"ANTMsg": "test"
/*ro, opt, string, range:[0,64]*/
```
},
```
```
"PhysicalInfo": {
```
/*ro, opt, object, BMI information, desc:this node is obtained after authentication by BMI scales which is connected to MinMoe terminals*/
"weight": 7000,
/*ro, opt, int, weight, unit:kg*/
"height": 18000
/*ro, opt, int, height, unit:cm*/
```
},
```
"meetingID": "test",
/*ro, opt, string, meeting ID, range:[1,32]*/
"PersonInfoExtends": [
/*ro, opt, array, additional person information, subType:object, desc:this node displays additional person information on the device*/
```
{
```
"id": 1,
/*ro, opt, int, extended ID of the additional person information, range:[1,32], desc:related URL: /ISAPI/AccessControl/personInfoExtendName?
```
format=json; this node is used for displaying the name of value; if ID does not exists, it starts from 1*/
```
"value": "test"
/*ro, opt, string, extended content of the additional person information*/
```
}
```
],
"customPrompt": "test",
/*ro, opt, string, custom prompt message, range:[1,128], desc:this node is displayed when the authentication result is authenticated, authentication
failed, or stranger*/
```
"FaceRect": {
```
/*ro, opt, object, rectangle frame for human face, desc:the origin is the upper-left corner of the screen*/
"height": 1.000,
/*ro, req, float, height, range:[0.000,1.000]*/
"width": 1.000,
/*ro, req, float, width, range:[0.000,1.000]*/
"x": 0.000,
/*ro, req, float, X-coordinate of the upper-left corner of the frame, range:[0.000,1.000]*/
"y": 0.000
/*ro, req, float, Y-coordinate of the upper-left corner of the frame, range:[0.000,1.000]*/
```
},
```
"faceSimilarity": 90,
/*ro, opt, int, Similarity, range:[0,100]*/
"faceRecognitionDistance": 0.1,
/*ro, opt, float, unit:m*/
"eyesDistance": 20,
/*ro, opt, int, range:[0,100], step:1*/
"faceRecognitionFailedReason": "attackBlacklist",
/*ro, opt, enum, subType:string*/
"currentAuthenticationTimes": 1,
/*ro, opt, int, range:[0,255], step:1*/
"allowAuthenticationTimes": 1,
/*ro, opt, int, range:[0,255], step:1*/
```
"LocalAttendanceData": {
```
/*ro, opt, object*/
"attendanceResult": [
/*ro, opt, array, subType:object*/
```
{
```
"date": "1970-01-01",
/*ro, opt, date*/
"week": 1,
```
/*ro, opt, enum, subType:int, desc:1 (Monday), 2 (Tuesday), 3 (Wednesday), 4 (Thursday), 5 (Friday), 6 (Saturday), 7 (Sunday)*/
```
"personalAttendanceStatus": "normal"
/*ro, opt, enum, subType:string*/
```
}
```
]
```
},
```
"hasRecord": true
/*ro, opt, bool*/
```
},
```
"URLCertificationType": "digest"
```
/*ro, opt, enum, picture URL authentication method, subType:string, desc:"no" (no authentication, it is used for the cloud protocol)，"digest" (digest
```
```
authentication, it is used for local picture URL returned by NVR or DVR)*/
```
```
}
```
Hikvision co MMC
adil@hikvision.co.az
```
Parameter Name ParameterValueParameterType(Content-Type) Content-ID File Name Description
```
AccessControllerEvent [Messagecontent] application/json -- -- --
Picture [Binary picturedata] image/jpeg pictureImage Picture.jpg --
VisibleLight [Binary picturedata] image/jpeg visibleLight_image VisibleLight.jpg --
Thermal [Binary picturedata] image/jpeg thermal_image Thermal.jpg --
HandPicture [Binary picturedata] image/jpeg hand_image HandPicture.jpg --
Note： The protocol is transmitted in form format. See Chapter 4.5.1.4 for form framework description, as shown in
the instance below.
--<frontier>
```
Content-Disposition: form-data; name=Parameter Name;filename=File Name
```
Content-Type: Parameter Type
Content-Length: ****
Content-ID: Content ID
Parameter Value
Request URL
GET /ISAPI/AccessControl/ClearPlansCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
Parameter Name: the name property of Content-Disposition in the header of form unit; it refers to the form unit
```
name.
```
Parameter Type (Content-Type): the Content-Type property in the header of form unit.
```
```
File Name (filename): the filename property of Content-Disposition of form unit Headers. It exists only when the
```
transmitted data of form unit is file, and it refers to the file name of form unit body.
Parameter Value: the body content of form unit.
12.5.2 Access Point Status Schedule
12.5.2.1 Get the capability of clearing access control schedule configuration.
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"ClearPlansCfg": {
```
/*ro, req, object*/
```
"ClearFlags": {
```
/*ro, opt, object*/
"doorStatusWeekPlan": "true,false",
/*ro, opt, string, whether to clear the week schedule of the door control*/
"cardReaderWeekPlan": "true,false",
/*ro, opt, string, whether to clear the week schedule of the card reader authentication mode control*/
"userRightWeekPlan": "true,false",
/*ro, opt, string, whether to clear the week schedule of the access permission control*/
"doorStatusHolidayPlan": "true,false",
/*ro, opt, string, whether to clear the holiday schedule of the door control*/
"cardReaderHolidayPlan": "true,false",
/*ro, opt, string, whether to clear the holiday schedule of the card reader authentication mode control*/
"userRightHolidayPlan": "true,false",
/*ro, opt, string, whether to clear the holiday schedule of the access permission control*/
"doorStatusHolidayGroup": "true,false",
/*ro, opt, string, whether to clear the holiday group of the door control*/
"cardReaderHolidayGroup": "true,false",
/*ro, opt, string, whether to clear the holiday group of the card reader authentication mode control*/
"userRightHolidayGroup": "true,false",
/*ro, opt, string, whether to clear the holiday group of the access permission control*/
"doorStatusTemplate": "true,false",
/*ro, opt, string, whether to clear the schedule template of the door control*/
"cardReaderTemplate": "true,false",
/*ro, opt, string, whether to clear the control schedule template of the card reader authentication mode*/
"userRightTemplate": "true,false"
/*ro, opt, string, whether to clear the schedule template of the access permission control*/
```
}
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/ClearPlansCfg?format=json
Query Parameter
None
Request Message
```
{
```
```
"ClearPlansCfg": {
```
/*opt, object*/
```
"ClearFlags": {
```
/*opt, object*/
"doorStatusWeekPlan": true,
/*opt, bool, whether to clear the week schedule of the door control*/
"cardReaderWeekPlan": true,
/*opt, bool, whether to clear the week schedule of the card reader authentication mode control*/
"userRightWeekPlan": true,
/*opt, bool, whether to clear the week schedule of the access permission control*/
"doorStatusHolidayPlan": true,
/*opt, bool, whether to clear the holiday schedule of the door control*/
"cardReaderHolidayPlan": true,
/*opt, bool, whether to clear the holiday schedule of the card reader authentication mode control*/
"userRightHolidayPlan": true,
/*opt, bool, whether to clear the holiday schedule of the access permission control*/
"doorStatusHolidayGroup": true,
/*opt, bool, whether to clear the holiday group of the door control*/
"cardReaderHolidayGroup": true,
/*opt, bool, whether to clear the holiday group of the card reader authentication mode control*/
"userRightHolidayGroup": true,
/*opt, bool, whether to clear the holiday group of the access permission control*/
"doorStatusTemplate": true,
/*opt, bool, whether to clear the schedule template of the door control*/
"cardReaderTemplate": true,
/*opt, bool, whether to clear the control schedule template of card reader authentication mode*/
"userRightTemplate": true
/*opt, bool, whether to clear the schedule template of access permission control*/
```
}
```
```
}
```
```
}
```
Response Message
12.5.2.2 Clear access control schedule configuration parameters
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded); it is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node must be returned when the value of statusCode is not 1*/
```
}
```
Request URL
PUT /ISAPI/AccessControl/DoorStatusHolidayGroupCfg/<holidayGroupID>?format=json
Query Parameter
Parameter Name Parameter Type Description
holidayGroupID string --
Request Message
```
{
```
```
"DoorStatusHolidayGroupCfg": {
```
/*opt, object*/
"enable": true,
/*req, bool, whether to enable, desc:whether to enable*/
"groupName": "test",
/*req, string, holiday group name*/
"holidayPlanNo": "1,3,5"
/*opt, string*/
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded); it is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node must be returned when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/DoorStatusHolidayGroupCfg/<holidayGroupID>?format=json
Query Parameter
Parameter
Name
Parameter
Type Description
holidayGroupID string Holiday group No., which starts from 1, and the maximum value supported by thedevice is obtained from the capability set.
Request Message
None
Response Message
12.5.2.3 Set holiday group parameters of door control schedule
12.5.2.4 Get the holiday group configuration parameters of the door control schedule
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"DoorStatusHolidayGroupCfg": {
```
/*ro, opt, object*/
"enable": true,
/*ro, req, bool, whether to enable: "true"-enable, "false"-disable*/
"groupName": "test",
/*ro, req, string, holiday group name*/
"holidayPlanNo": "1,3,5"
/*ro, req, string*/
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/DoorStatusHolidayGroupCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"DoorStatusHolidayGroupCfg": {
```
/*ro, opt, object*/
```
"groupNo": {
```
/*ro, opt, object, holiday group No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether to enable, desc:true (enable)*/
```
```
"groupName": {
```
/*ro, opt, object, length of holiday group name*/
"@min": 1,
/*ro, opt, int, the minimum length*/
"@max": 32
/*ro, opt, int, the maximum length*/
```
},
```
```
"holidayPlanNo": {
```
/*ro, opt, object, holiday group plan No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/DoorStatusHolidayPlanCfg/<holidayPlanID>?format=json
Query Parameter
Parameter
Name
Parameter
Type Description
holidayPlanID string Holiday schedule No., which starts from 1, and the maximum value supported by thedevice is obtained from the capability set.
Request Message
None
Response Message
12.5.2.5 Get the configuration capability of door status parameters of holiday group
12.5.2.6 Get the configuration parameters of the door control holiday schedule
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"DoorStatusHolidayPlanCfg": {
```
/*ro, req, object*/
"enable": true,
```
/*ro, req, bool, whether to enable, desc:true (enable), false (disable)*/
```
"beginDate": "2017-10-01",
/*ro, req, date, start date of the holiday*/
"endDate": "2017-10-08",
/*ro, req, date, end date of the holiday*/
"HolidayPlanCfg": [
/*ro, req, array, holiday schedule parameters, subType:object*/
```
{
```
"id": 1,
/*ro, req, int, time period No., range:[1,8]*/
"enable": true,
```
/*ro, req, bool, whether to enable, desc:true (enable), false (disable)*/
```
"doorStatus": "remainClosed",
```
/*ro, req, enum, door status, subType:string, desc:“remainOpen”-remain open (access without authentication), “remainClosed”-remain closed
```
```
(access is not allowed), “normal”-access by authentication, "sleep", "invalid”, “induction”, “barrierFree”*/
```
```
"TimeSegment": {
```
/*ro, opt, object, time*/
"beginTime": "00:00:00",
/*ro, req, time, start time of the time period, desc:device local time*/
"endTime": "10:00:00"
/*ro, req, time, end time of the time period, desc:device local time*/
```
}
```
```
}
```
]
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/DoorStatusHolidayPlanCfg/<holidayPlanID>?format=json
Query Parameter
Parameter Name Parameter Type Description
holidayPlanID string --
Request Message
```
{
```
```
"DoorStatusHolidayPlanCfg": {
```
/*ro, req, object*/
"enable": true,
/*ro, req, bool, whether to enable, desc:"true"-enable, "false"-disable*/
"beginDate": "2017-10-01",
/*ro, req, date, start date of the holiday*/
"endDate": "2017-10-08",
/*ro, req, date, end data of the holiday*/
"HolidayPlanCfg": [
/*ro, req, array, holiday schedule parameters, subType:object*/
```
{
```
"id": 1,
/*ro, req, int, time period No., range:[1,8]*/
"enable": true,
/*ro, req, bool, whether to enable, desc:"true"-enable, "false"-disable*/
"doorStatus": "remainClosed",
```
/*ro, req, enum, door status, subType:string, desc:"remainOpen"-remain open (access without authentication), "remainClosed"-remain closed
```
```
(access is not allowed), "normal"-access by authentication, "sleep", "invalid”*/
```
```
"TimeSegment": {
```
/*ro, opt, object, time*/
"beginTime": "00:00:00",
/*ro, req, time, start time, desc:device local time*/
"endTime": "10:00:00"
/*ro, req, time, end time, desc:device local time*/
```
}
```
```
}
```
]
```
}
```
```
}
```
Response Message
12.5.2.7 Set parameters of door control holiday schedule
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded); it is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node must be returned when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/DoorStatusHolidayPlanCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"DoorStatusHolidayPlanCfg": {
```
/*ro, opt, object*/
```
"planNo": {
```
/*ro, opt, object, holiday schedule No.*/
"@min": 1,
/*ro, opt, int*/
"@max": 16
/*ro, opt, int*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether to enable: "true"-enable,"false"-disable, desc:"true" (enable), "false" (disable)*/
```
"beginDate": "1970-01-01",
/*ro, opt, date, start date of the holiday*/
"endDate": "1971-01-01",
/*ro, opt, date, end date of the holiday*/
```
"HolidayPlanCfg": {
```
/*ro, opt, object*/
"maxSize": 8,
/*ro, opt, int*/
```
"id": {
```
/*ro, opt, object, time period No.*/
"@min": 1,
/*ro, opt, int*/
"@max": 8
/*ro, opt, int*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether to enable: "true"-enable,"false"-disable, desc:"true" (enable), "false" (disable)*/
```
```
"doorStatus": {
```
/*ro, opt, object, door status*/
"@opt": "remainOpen,remainClosed,normal,sleep,invlid,induction,barrierFree"
```
/*ro, opt, string, desc:"remainOpen" (remain open (access without authentication)), "remainClosed" (remain closed (access is not allowed)),
```
```
"normal" (access by authentication), "sleep", "invalid"*/
```
```
},
```
```
"TimeSegment": {
```
/*ro, opt, object, time*/
"beginTime": "00:00:00",
```
/*ro, opt, time, start time of the time period (device local time), desc:device local time*/
```
"endTime": "00:00:00",
```
/*ro, opt, time, end time of the time period (device local time), desc:device local time*/
```
"validUnit": "minute"
```
/*ro, opt, enum, time accuracy, subType:string, desc:"hour", "minute", "second"; if this node is not returned, the default time accuracy is
```
"minute"*/
```
}
```
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/DoorStatusPlan/<doorID>?format=json
12.5.2.8 Get the configuration capability of the door control holiday schedule
12.5.2.9 Get the configuration parameters of the door control schedule
Hikvision co MMC
adil@hikvision.co.az
Query Parameter
Parameter
Name
Parameter
Type Description
doorID string Door No., which starts from 1, and the maximum value supported by the device isobtained from the capability set.
Request Message
None
Response Message
```
{
```
```
"DoorStatusPlan": {
```
/*ro, req, object*/
"templateNo": 1
```
/*ro, req, int, schedule template No., desc:0-cancel linking the template with the schedule and restore to the default status (normal status)*/
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/DoorStatusPlan/<doorID>?format=json
Query Parameter
Parameter Name Parameter Type Description
doorID string --
Request Message
```
{
```
```
"DoorStatusPlan": {
```
/*req, object*/
"templateNo": 1
```
/*req, int, schedule template No., desc:0-cancel linking the template with the schedule and restore to the default status (normal status)*/
```
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded); it is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node must be returned when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/DoorStatusPlan/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.2.10 Set parameters of door control schedule
12.5.2.11 Get the configuration capability of the door control schedule
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"DoorStatusPlan": {
```
/*ro, opt, object*/
```
"doorNo": {
```
/*ro, opt, object, door No.*/
"@min": 1,
/*ro, opt, int*/
"@max": 4
/*ro, opt, int*/
```
},
```
```
"templateNo": {
```
/*ro, opt, object, schedule template No.*/
"@min": 1,
/*ro, opt, int*/
"@max": 16
/*ro, opt, int*/
```
}
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/DoorStatusPlanTemplate/<planTemplateID>?format=json
Query Parameter
Parameter Name Parameter Type Description
planTemplateID string --
Request Message
```
{
```
```
"DoorStatusPlanTemplate": {
```
/*ro, opt, object, door control schedule template*/
"enable": true,
/*ro, req, bool, whether to enable, desc:"true"-enable, "false"-disable*/
"templateName": "test",
/*ro, req, string, template name*/
"weekPlanNo": 1,
/*ro, req, int, weekly schedule No.*/
"holidayGroupNo": "1,3,5"
/*ro, req, string, holiday group No., desc:holiday group No.*/
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded); it is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node must be returned when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/DoorStatusPlanTemplate/<planTemplateID>?format=json
Query Parameter
Parameter
Name
Parameter
Type Description
planTemplateID string Schedule template No., which starts from 1, and the maximum value supported by thedevice is obtained from the capability set.
12.5.2.12 Set parameters of door control schedule template
12.5.2.13 Get parameters of door control schedule template
Hikvision co MMC
adil@hikvision.co.az
Request Message
None
Response Message
```
{
```
```
"DoorStatusPlanTemplate": {
```
/*ro, req, object, door control schedule template*/
"enable": true,
/*ro, req, bool, whether to enable, desc:"true"-enable, "false"-disable*/
"templateName": "test",
/*ro, req, string, template name*/
"weekPlanNo": 1,
/*ro, req, int, weekly schedule No.*/
"holidayGroupNo": "1,3,5",
/*ro, req, string, holiday group No., desc:holiday group No.*/
"doorNoList": [1, 2, 3],
/*ro, opt, array, subType:int, range:[1,128]*/
"doorNameList": ["door1", "door2", "door3"],
/*ro, opt, array, subType:string*/
"regionNodeNameList": ["区域1", "区域2", "区域3"]
/*ro, opt, array, subType:string*/
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/DoorStatusPlanTemplate/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"DoorStatusPlanTemplate": {
```
/*ro, opt, object, schedule template*/
```
"templateNo": {
```
/*ro, opt, object, schedule template No.*/
"@min": 1,
/*ro, opt, int, the minimum value of schedule template No.*/
"@max": 16
/*ro, opt, int, the maximum value of schedule template No.*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether to enable, desc:true (enable), false (disable)*/
```
```
"templateName": {
```
/*ro, opt, object, template name length*/
"@min": 1,
/*ro, opt, int, the minimum value of template name length*/
"@max": 32
/*ro, opt, int, the maximum value of template name length*/
```
},
```
```
"weekPlanNo": {
```
/*ro, opt, object, weekly schedule No.*/
"@min": 1,
/*ro, opt, int, the minimum value of weekly schedule No.*/
"@max": 16
/*ro, opt, int, the maximum value of weekly schedule No.*/
```
},
```
```
"holidayGroupNo": {
```
/*ro, opt, object, holiday group No.*/
"@min": 1,
/*ro, opt, int, the minimum value of holiday group No.*/
"@max": 16
/*ro, opt, int, the maximum value of holiday group No.*/
```
}
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/DoorStatusWeekPlanCfg/<weekPlanID>?format=json
12.5.2.14 Get the configuration capability of the door control schedule template
12.5.2.15 Set parameters of door control weekly schedule
Hikvision co MMC
adil@hikvision.co.az
Query Parameter
Parameter Name Parameter Type Description
weekPlanID string --
Request Message
```
{
```
```
"DoorStatusWeekPlanCfg": {
```
/*opt, object, weekly schedule of door control*/
"enable": true,
/*req, bool, whether to enable, desc:"true"-enable, "false"-disable*/
"WeekPlanCfg": [
/*req, array, weekly schedule parameters, subType:object*/
```
{
```
"week": "Monday",
/*req, enum, days of the week, subType:string, desc:"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"*/
"id": 1,
/*req, int, time period No., range:[1,8]*/
"enable": true,
/*req, bool, whether to enable*/
"doorStatus": "remainClosed",
```
/*req, enum, door control schedule, subType:string, desc:"remainOpen"-remain open (access without authentication), "remainClosed"-remain
```
```
closed (access is not allowed), "normal"-access by authentication, "sleep", "invalid”*/
```
```
"TimeSegment": {
```
/*req, object, time*/
"beginTime": "00:00:00",
/*req, time, start time, desc:device local time*/
"endTime": "10:00:00"
/*req, time, end time, desc:device local time*/
```
}
```
```
}
```
]
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded); it is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node must be returned when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/DoorStatusWeekPlanCfg/<weekPlanID>?format=json
Query Parameter
Parameter
Name
Parameter
Type Description
weekPlanID string Weekly schedule No., which starts from 1, and the maximum value supported by thedevice is obtained from the capability set.
Request Message
None
Response Message
12.5.2.16 Get the configuration parameters of the door control week scheduleHikvision co MMC
adil@hikvision.co.az
```
{
```
```
"DoorStatusWeekPlanCfg": {
```
/*ro, opt, object, door control week schedule*/
"enable": true,
```
/*ro, req, bool, whether to enable, desc:true (enable), false (disable)*/
```
"beginDate": "2024-01-10",
/*ro, opt, date*/
"endDate": "2024-09-10",
/*ro, opt, date*/
"WeekPlanCfg": [
/*ro, req, array, week schedule parameters, subType:object*/
```
{
```
"week": "Monday",
/*ro, req, enum, days of the week, subType:string, desc:"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday”*/
"id": 1,
/*ro, req, int, time period No., range:[1,8]*/
"enable": true,
/*ro, req, bool, whether to enable: "true"-enable, "false"-disable*/
"doorStatus": "remainClosed",
```
/*ro, req, enum, door status, subType:string, desc:"remainOpen"-remain open (access without authentication), "remainClosed"-remain closed
```
```
(access is not allowed), "normal"-access by authentication, "sleep","invalid”, “induction”, “barrierFree”*/
```
```
"TimeSegment": {
```
/*ro, req, object, time*/
"beginTime": "00:00:00",
/*ro, req, time, start time of the time period, desc:device local time*/
"endTime": "10:00:00"
/*ro, req, time, end time of the time period, desc:device local time*/
```
}
```
```
}
```
]
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/DoorStatusWeekPlanCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.2.17 Get the configuration capability of the door control week schedule
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"DoorStatusWeekPlanCfg": {
```
/*ro, opt, object*/
```
"planNo": {
```
/*ro, opt, object, week schedule No.*/
"@min": 1,
/*ro, opt, int*/
"@max": 16
/*ro, opt, int*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether to enable: "true"-enable,"false"-disable, desc:"true" (enable), "false" (disable)*/
```
```
"WeekPlanCfg": {
```
/*ro, opt, object, week schedule parameters*/
"maxSize": 56,
/*ro, opt, int*/
```
"week": {
```
/*ro, opt, object*/
"@opt": "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday"
/*ro, opt, string, desc:"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"*/
```
},
```
```
"id": {
```
/*ro, opt, object, weekly schedule No.*/
"@min": 1,
/*ro, opt, int*/
"@max": 8
/*ro, opt, int*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether to enable: "true"-enable,"false"-disable, desc:"true" (enable), "false" (disable)*/
```
```
"doorStatus": {
```
/*ro, opt, object, door status*/
"@opt": "remainOpen,remainClosed,normal,sleep,invalid,induction,barrierFree"
```
/*ro, opt, string, desc:"remainOpen" (remain open (access without authentication)), "remainClosed" (remain closed (access is not allowed)),
```
```
"normal" (access by authentication), "sleep", "invalid"*/
```
```
},
```
```
"TimeSegment": {
```
/*ro, opt, object, time*/
"beginTime": "00:00:00",
```
/*ro, opt, time, start time of the time period (device local time), desc:device local time*/
```
"endTime": "10:00:00",
```
/*ro, opt, time, end time of the time period (device local time), desc:device local time*/
```
"validUnit": "minute"
```
/*ro, opt, enum, time accuracy, subType:string, desc:"hour", "minute", "second"; if this node is not returned, the default time accuracy is
```
"minute"*/
```
}
```
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/AcsCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"AcsCfg": {
```
/*ro, req, object*/
"voicePrompt": "true,false",
```
/*ro, opt, string, whether to enable voice prompt, desc:"true” (yes), "false” (no)*/
```
"uploadCapPic": "true,false",
```
/*ro, opt, string, whether to upload the picture from linked capture, desc:"true” (yes), "false” (no)*/
```
"saveCapPic": "true,false",
```
/*ro, opt, string, whether to save the captured picture, desc:"true” (yes), "false” (no)*/
```
```
"protocol": {
```
```
/*ro, opt, object, communication protocol type of the card reader, desc:"Private” (private protocol), "OSDP” (OSDP protocol)*/
```
"@opt": "Private,OSDP"
/*ro, opt, string, optional item*/
```
},
```
"showPicture": "true,false",
```
/*ro, opt, string, whether to display the authenticated picture, desc:"true” (yes), "false” (no)*/
```
"showEmployeeNo": "true,false",
```
/*ro, opt, string, whether to display the authenticated employee ID, desc:"true” (yes), "false” (no)*/
```
"showName": "true,false",
12.5.3 Access Control Device Management
12.5.3.1 Get the configuration capability of the access controller
Hikvision co MMC
adil@hikvision.co.az
"showName": "true,false",
```
/*ro, opt, string, whether to display the authenticated name, desc:"true” (yes), "false” (no)*/
```
```
"desensitiseEmployeeNo": {
```
/*ro, opt, object, whether to enable employee No. de-identification for local UI display*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"desensitiseName": {
```
/*ro, opt, object, whether to enable name de-identification for local UI display*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"thermalEnabled": {
```
/*ro, opt, object, whether to enable temperature measurement*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"thermalMode": {
```
```
/*ro, opt, object, whether to enable temperature measurement only mode: true-enable (only for temperature measurement),false-disable (default)*/
```
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"thermalPictureEnabled": {
```
```
/*ro, opt, object, whether to enable uploading visible light pictures in temperature measurement only mode: true-enable,false-disable (default).
```
This field is used to control uploading captured pictures and visible light pictures, desc:whether to enable uploading visible light pictures in temperature
```
measurement only mode: true-enable,false-disable (default). This field is used to control uploading captured pictures and visible light pictures*/
```
"@opt": [true, false]
/*ro, opt, array, whether to enable uploading visible light pictures in temperature measurement only mode, subType:bool*/
```
},
```
```
"highestThermalThreshold": {
```
/*ro, opt, object, maximum value of the temperature threshold, desc:float,upper limit of the temperature threshold which is accurate to one decimal
place,unit: Celsius*/
"@min": 1.0,
/*ro, opt, float*/
"@max": 2.0
/*ro, opt, float*/
```
},
```
```
"lowestThermalThreshold": {
```
/*ro, opt, object, minimum value of the temperature threshold, desc:float,lower limit of the temperature threshold which is accurate to one decimal
place,unit: Celsius*/
"@min": 1.0,
/*ro, opt, float*/
"@max": 2.0
/*ro, opt, float*/
```
},
```
```
"thermalDoorEnabled": {
```
/*ro, opt, object, whether to open the door according to the temperature threshold, desc:whether to open the door when the temperature is above the
```
upper limit (highestThermalThreshold) or below the lower limit (lowestThermalThreshold) of the threshold: true (open the door), false (not open the door
```
```
(default))*/
```
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"QRCodeEnabled": {
```
```
/*ro, opt, object, whether to enable QR code function, desc:whether to enable QR code function: true-enable,false-disable (default)*/
```
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"remoteCheckDoorEnabled": {
```
/*ro, opt, object, whether to enable controlling the door by remote verification, desc:whether to enable controlling the door by remote
```
verification: true-control,false-not control (default)*/
```
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"checkChannelType": {
```
/*ro, opt, object, verification channel type, desc:verification channel type*/
"@opt": ["Ezviz", "ISUP", "ISAPI", "PrivateSDK", "ISAPIListen"]
/*ro, opt, array, subType:string*/
```
},
```
"isSupportChannelIp": true,
/*ro, opt, bool, whether it supports configuring IP address of the verification channel, desc:whether it supports configuring IP address of the
verification channel: true-yes,this field is not returned-no*/
"uploadVerificationPic": "true,false",
/*ro, opt, string, whether to upload the authenticated picture, desc:"true"-yes, "false"-no*/
"saveVerificationPic": "true,false",
```
/*ro, opt, string, whether to save the authenticated picture, desc:"true” (yes), "false” (no)*/
```
"saveFacePic": "true,false",
```
/*ro, opt, string, whether to save the registered face picture, desc:"true” (yes), "false” (no)*/
```
```
"thermalUnit": {
```
```
/*ro, opt, object, temperature unit, desc:object,temperature unit: "celsius" (default),"fahrenheit"*/
```
"@opt": ["celsius", "fahrenheit"]
/*ro, opt, array, subType:string*/
```
},
```
```
"highestThermalThresholdF": {
```
/*ro, opt, object, maximum value of the temperature threshold, desc:the value is accurate to one decimal place, and the unit is Fahrenheit*/
"@min": 1.0,
/*ro, opt, float*/
"@max": 1.0
/*ro, opt, float*/
```
},
```
```
"lowestThermalThresholdF": {
```
/*ro, opt, object, minimum value of the temperature threshold, desc:the value is accurate to one decimal place, and the unit is Fahrenheit*/
"@min": 1.0,
/*ro, opt, float*/
"@max": 1.0
Hikvision co MMC
adil@hikvision.co.az
"@max": 1.0
/*ro, opt, float*/
```
},
```
```
"thermalCompensation": {
```
/*ro, opt, object, temperature compensation*/
"@min": -99.9,
/*ro, opt, float*/
"@max": 99.9
/*ro, opt, float*/
```
},
```
```
"externalCardReaderEnabled": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, req, array, subType:bool*/
```
},
```
```
"combinationAuthenticationTimeout": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, req, int, range:[1,20], step:1, unit:s*/
"@max": 20
/*ro, req, int, range:[1,20], step:1, unit:s*/
```
},
```
```
"combinationAuthenticationLimitOrder": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, req, array, subType:bool*/
```
},
```
```
"saveVPAudioFile": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, req, array, subType:bool*/
```
},
```
```
"saveVPAudioFileByAuth": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, req, array, subType:bool*/
```
},
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/AcsCfg?format=json
Query Parameter
None
Request Message
12.5.3.2 Set the parameters of the access controller
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"AcsCfg": {
```
/*req, object, parameters of the access controller*/
"voicePrompt": true,
/*opt, bool, whether to enable voice prompt*/
"uploadCapPic": true,
/*opt, bool, whether to upload the picture from linked capture, desc:whether to upload the picture from linked capture*/
"saveCapPic": true,
/*opt, bool, whether to save the captured picture, desc:whether to save the captured picture*/
"showPicture": true,
/*opt, bool, whether to display the authenticated picture, desc:whether to display the authenticated picture*/
"showEmployeeNo": true,
/*opt, bool, whether to display the authenticated employee ID*/
"showName": true,
/*opt, bool, whether to display the authenticated name*/
"thermalEnabled": true,
/*opt, bool, whether to enable temperature measurement*/
"thermalMode": true,
/*opt, bool, whether to enable temperature measurement only mode*/
"thermalPictureEnabled": true,
/*opt, bool, whether to enable uploading visible light pictures in temperature measurement only mode*/
"highestThermalThreshold": 37.3,
/*opt, float, maximum value of the temperature threshold*/
"lowestThermalThreshold": 38.5,
/*opt, float, minimum value of the temperature threshold*/
"thermalDoorEnabled": false,
```
/*opt, bool, whether to open the door when the temperature is above the upper limit (highestThermalThreshold) or below the lower limit
```
```
(lowestThermalThreshold) of the threshold: true-open the door,false-not open the door (default), desc:whether to open the door when the temperature is above
```
```
the upper limit (highestThermalThreshold) or below the lower limit (lowestThermalThreshold) of the threshold: true (open the door), false (not open the door
```
```
(default))*/
```
"QRCodeEnabled": false,
/*opt, bool, whether to enable QR code function*/
"remoteCheckDoorEnabled": false,
/*opt, bool, whether to enable controlling the door by remote verification, desc:whether to enable controlling the door by remote verification*/
"checkChannelType": "Ezviz",
```
/*opt, enum, verification channel type, subType:string, dep:or,{$.AcsCfg.remoteCheckDoorEnabled,eq,true}, desc:verification channel type: "Ezviz"-
```
EZVIZ channel,"ISUP"-ISUP channel,"ISAPI"-ISAPI channel,"PrivateSDK"-private SDK channel,"ISAPIListen"-ISAPI listening channel. This field is valid when
remoteCheckDoorEnabled is true*/
"channelIp": "test",
```
/*opt, string, IP address of the verification channel, dep:and,{$.AcsCfg.checkChannelType,eq,PrivateSDK}, desc:this field is valid when
```
checkChannelType is "PrivateSDK"*/
"uploadVerificationPic": true,
/*opt, bool, whether to upload the authenticated picture, desc:whether to upload the authenticated picture*/
"saveVerificationPic": true,
/*opt, bool, whether to save the authenticated picture, desc:whether to save the authenticated picture*/
"saveFacePic": true,
/*opt, bool, whether to save the registered face picture, desc:whether to save the registered face picture*/
"thermalUnit": "celsius",
/*opt, enum, temperature unit, subType:string, desc:"celsius", "fahrenheit"*/
"highestThermalThresholdF": 1.0,
/*opt, float, the maximum value of the temperature threshold, desc:the value is accurate to one decimal place, and the unit is Fahrenheit this node
is used to check whether to open the door when the temperature is higher than the threshold*/
"lowestThermalThresholdF": 1.0,
/*opt, float, the minimum value of the temperature threshold, desc:the value is accurate to one decimal place, and the unit is Fahrenheit this node
is used to check whether to open the door when the temperature is higher than the threshold*/
"thermalCompensation": 1.0,
/*opt, float, temperature compensation, desc:float,temperature compensation,the value is accurate to one decimal place. The unit depends on the node
thermalUnit. If the node thermalUnit does not exist,the default unit is Celsius*/
"externalCardReaderEnabled": true,
/*opt, bool*/
"combinationAuthenticationTimeout": 1,
/*opt, int, range:[1,20], step:1, unit:s*/
"combinationAuthenticationLimitOrder": true,
/*opt, bool*/
"saveVPAudioFile": false,
/*opt, bool*/
"saveVPAudioFileByAuth": false,
/*opt, bool*/
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
/*ro, opt, int, status code, desc:status code*/
"statusString": "ok",
/*ro, opt, string, status description, range:[1,64], desc:status description*/
"subStatusCode": "ok",
/*ro, opt, string, sub status code, range:[1,64], desc:sub status code*/
"errorCode": 1,
/*ro, opt, int, error code, desc:error code*/
"errorMsg": "ok"
/*ro, opt, string, error description, desc:error description*/
```
}
```
Hikvision co MMC
adil@hikvision.co.az
Request URL
GET /ISAPI/AccessControl/AcsCfg?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"AcsCfg": {
```
/*ro, req, object*/
"RS485Backup": true,
/*ro, opt, bool, whether to enable downstream RS-485 communication redundancy*/
"showCapPic": true,
/*ro, opt, bool, whether to display the captured picture*/
"showUserInfo": true,
/*ro, opt, bool, whether to display user information*/
"overlayUserInfo": true,
/*ro, opt, bool, whether to overlay user information*/
"voicePrompt": true,
/*ro, opt, bool, whether to enable voice prompt*/
"uploadCapPic": true,
/*ro, opt, bool, whether to upload the picture from linked capture, desc:whether to upload the picture from linked capture*/
"saveCapPic": true,
/*ro, opt, bool, whether to save the captured picture, desc:whether to save the captured picture*/
"inputCardNo": true,
/*ro, opt, bool, whether to allow inputting card No. on keypad*/
"enableWifiDetect": true,
/*ro, opt, bool, whether to enable Wi-Fi probe*/
"enable3G4G": true,
/*ro, opt, bool, whether to enable 3G/4G*/
"protocol": "Private",
```
/*ro, opt, enum, communication protocol type of the card reader, subType:string, desc:"Private” (private protocol), "OSDP” (OSDP protocol)*/
```
"enableCaptureCertificate": true,
```
/*ro, opt, bool, whether to enable capturing the ID picture, desc:true (yes), false (no). If this node does not exist, it indicates that this
```
```
function is not supported*/
```
"showPicture": true,
/*ro, opt, bool, whether to display the authenticated picture, desc:whether to display the authenticated picture*/
"showPresetPicture": true,
/*ro, opt, bool*/
"showEmployeeNo": true,
/*ro, opt, bool, whether to display the authenticated employee ID*/
"showName": true,
/*ro, opt, bool, whether to display the authenticated name*/
"showPhoneNo": true,
/*ro, opt, bool*/
"desensitiseEmployeeNo": true,
```
/*ro, opt, bool, whether to enable employee No. de-identification for local UI display, dep:or,{$.AcsCfg.showEmployeeNo,eq,true}*/
```
"desensitiseName": true,
```
/*ro, opt, bool, whether to enable name de-identification for local UI display, dep:or,{$.AcsCfg.showName,eq,true}*/
```
"desensitisePhoneNo": true,
```
/*ro, opt, bool, dep:or,{$.AcsCfg.showPhoneNo,eq,true}*/
```
"thermalEnabled": true,
/*ro, opt, bool, whether to enable temperature measurement*/
"thermalMode": true,
/*ro, opt, bool, whether to enable temperature measurement only mode*/
"thermalPictureEnabled": true,
```
/*ro, opt, bool, whether to enable uploading visible light pictures in temperature measurement only mode: true-enable,false-disable (default). This
```
field is used to control uploading captured pictures and visible light pictures*/
"thermalIp": "192.168.1.1",
```
/*ro, opt, string, IP address of the thermography device, desc:for access control devices, each device only requires one IP address; for metal
```
detector doors, this field does not need to be configured*/
"highestThermalThreshold": 37.3,
/*ro, opt, float, upper limit of the temperature threshold*/
"lowestThermalThreshold": 38.5,
/*ro, opt, float, lower limit of the temperature threshold*/
"thermalDoorEnabled": false,
/*ro, opt, bool, whether to open the door according to the temperature threshold, desc:whether to open the door when the temperature is above the
```
upper limit (highestThermalThreshold) or below the lower limit (lowestThermalThreshold) of the threshold: true (open the door), false (not open the door
```
```
(default))*/
```
"QRCodeEnabled": false,
/*ro, opt, bool, whether to enable QR code function*/
"remoteCheckDoorEnabled": false,
/*ro, opt, bool, whether to enable controlling the door by remote verification, desc:whether to enable controlling the door by remote verification*/
"checkChannelType": "Ezviz",
```
/*ro, opt, enum, verification channel type, subType:string, dep:or,{$.AcsCfg.remoteCheckDoorEnabled,eq,true}, desc:verification channel type*/
```
"channelIp": "test",
```
/*ro, opt, string, IP address of the verification channel, dep:and,{$.AcsCfg.checkChannelType,eq,PrivateSDK}, desc:this field is valid when
```
checkChannelType is "PrivateSDK"*/
"needDeviceCheck": true,
```
/*ro, opt, bool, dep:or,{$.AcsCfg.remoteCheckDoorEnabled,eq,true}*/
```
"remoteCheckTimeout": 5,
```
/*ro, opt, int, range:[1,10], unit:s, dep:or,{$.AcsCfg.remoteCheckDoorEnabled,eq,true}*/
```
12.5.3.3 Get the configuration parameters of the access controller
Hikvision co MMC
adil@hikvision.co.az
```
/*ro, opt, int, range:[1,10], unit:s, dep:or,{$.AcsCfg.remoteCheckDoorEnabled,eq,true}*/
```
"remoteCheckVerifyMode": 1,
```
/*ro, opt, enum, subType:int, dep:or,{$.AcsCfg.remoteCheckDoorEnabled,eq,true}*/
```
"offlineDevCheckOpenDoorEnabled": false,
```
/*ro, opt, bool, dep:or,{$.AcsCfg.remoteCheckDoorEnabled,eq,true}*/
```
"remoteCheckWithISAPIListen": "async",
```
/*ro, opt, enum, subType:string, dep:or,{$.AcsCfg.checkChannelType,eq,ISAPIListen}*/
```
"uploadVerificationPic": true,
/*ro, opt, bool, whether to upload the authenticated picture, desc:whether to upload the authenticated picture*/
"uploadVerificationPicType": 0,
/*ro, opt, enum, subType:int*/
"saveVerificationPic": true,
/*ro, opt, bool, whether to save the authenticated picture, desc:whether to save the authenticated picture*/
"saveFacePic": true,
/*ro, opt, bool, whether to save the registered face picture, desc:whether to save the registered face picture*/
"thermalUnit": "celsius",
/*ro, opt, enum, temperature unit, subType:string, desc:"celsius", "fahrenheit"*/
"highestThermalThresholdF": 1.0,
/*ro, opt, float, the maximum value of the temperature threshold, desc:the value is accurate to one decimal place, and the unit is Fahrenheit this
node is used to check whether to open the door when the temperature is higher than the threshold*/
"lowestThermalThresholdF": 1.0,
/*ro, opt, float, the minimum value of the temperature threshold, desc:the value is accurate to one decimal place, and the unit is Fahrenheit this
node is used to check whether to open the door when the temperature is higher than the threshold*/
"enable5G": true,
/*ro, opt, bool, whether to enable 5G*/
"thermalCompensation": 1.0,
/*ro, opt, float, temperature compensation, desc:float,temperature compensation,the value is accurate to one decimal place. The unit depends on the
node thermalUnit. If the node thermalUnit does not exist,the default unit is Celsius*/
"externalCardReaderEnabled": true,
/*ro, opt, bool*/
"combinationAuthenticationTimeout": 1,
/*ro, opt, int, range:[1,20], step:1, unit:s*/
"combinationAuthenticationLimitOrder": true,
/*ro, opt, bool*/
"passwordEnabled": true,
/*ro, opt, bool*/
"showGender": true,
/*ro, opt, bool, whether to display gender*/
"showSignInTime": true,
/*ro, opt, bool*/
"showsCustomInfo": true,
/*ro, opt, bool*/
"showMobileWebQRCode": true,
/*ro, opt, bool*/
"fireAlarmInputType": "alwaysOpen",
/*ro, opt, enum, subType:string*/
"buzzerEnabled": true,
/*ro, opt, bool*/
"saveVPAudioFile": false,
/*ro, opt, bool*/
"saveVPAudioFileByAuth": false,
/*ro, opt, bool*/
"faceDuplicateCheckEnabled": false,
/*ro, opt, bool*/
"localControllerBackupMode": 1,
/*ro, opt, enum, subType:int*/
"maxlocalControllerNum": 64,
/*ro, opt, int*/
"saveFpPicByCollectionMode": false,
/*ro, opt, bool*/
"faceBatchModelingMode": "recognitionPriority",
/*ro, opt, enum, subType:string*/
"externalAuthResultDisplayEnabled": false
/*ro, opt, bool*/
```
}
```
```
}
```
the access controller Request URL
GET /ISAPI/AccessControl/AcsWorkStatus/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"AcsWorkStatus": {
```
/*ro, req, object*/
```
"doorLockStatus": {
```
```
/*ro, opt, object, door lock status (relay status): 0-normally close, 1-normally open, 2-short-circuit alarm, 3-broken-circuit alarm, 4-exception
```
alarm*/
"@opt": "0,1,2,3,4"
12.5.3.4 Get the capability of getting the working status of
Hikvision co MMC
adil@hikvision.co.az
"@opt": "0,1,2,3,4"
/*ro, opt, string*/
```
},
```
```
"doorStatus": {
```
```
/*ro, opt, object, door (floor) status: 1-sleep, 2-remain unlocked (free), 3-remain locked (disabled), 4-normal status (controlled)*/
```
"@opt": "1,2,3,4"
/*ro, opt, string*/
```
},
```
```
"magneticStatus": {
```
/*ro, opt, object, magnetic contact status: 0-normally close,1-normally open, 2-short-circuit alarm, 3-broken-circuit alarm, 4-exception alarm*/
"@opt": "0,1,2,3,4"
/*ro, opt, string, magnetic contact status*/
```
},
```
```
"caseStatus": {
```
/*ro, opt, object, event trigger status*/
"@min": 1,
/*ro, opt, int, event trigger status*/
"@max": 1
/*ro, opt, int, event trigger status*/
```
},
```
```
"antiSneakStatus": {
```
/*ro, opt, object, anti-passback status: "close"-disabled,"open"-enabled*/
"@opt": "close,open"
/*ro, opt, string*/
```
},
```
```
"hostAntiDismantleStatus": {
```
/*ro, opt, object, tampering status of the access control device: "close"-disabled, "open"-enabled*/
"@opt": "close,open"
/*ro, opt, string*/
```
},
```
```
"cardReaderOnlineStatus": {
```
/*ro, opt, object, online status of the authentication unit*/
"@min": 1,
/*ro, opt, int, the minimum value, range:[1,8]*/
"@max": 1
/*ro, opt, int, the maximum value, range:[1,8]*/
```
},
```
```
"cardReaderAntiDismantleStatus": {
```
/*ro, opt, object, tampering status of the authentication unit*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"cardReaderVerifyMode": {
```
/*ro, opt, object, current authentication mode of the authentication unit, desc:1-sleep,2-card+password,3-card,4-card or password,5-fingerprint,6-
fingerprint+password,7-fingerprint or card,8-fingerprint+card,9-fingerprint+card+password,10-face or fingerprint or card or password,11-face+fingerprint,12-
face+password,13-face+card,14-face,15-employee No.+password,16-fingerprint or password,17-employee No.+fingerprint,18-employee No.+fingerprint+password,19-
face+fingerprint+card,20-face+password+fingerprint,21-employee No.+face,22-face or face+card,23-fingerprint or face,24-card or face or password,25-card or
face,26-card or face or fingerprint,27-card or fingerprint or password*/
"@opt": "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34"
/*ro, opt, string*/
```
},
```
```
"alarmOutStatus": {
```
/*ro, opt, object, No. of output port with alarms*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"cardNum": {
```
/*ro, opt, object, number of added cards*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"netStatus": {
```
/*ro, opt, object, network connection status*/
"@opt": ["connect", "disconnect", "ipConflict"]
/*ro, opt, array, subType:string*/
```
},
```
```
"InterfaceStatusList": {
```
/*ro, opt, object*/
"@size": 2,
/*ro, opt, int*/
```
"id": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 2
/*ro, opt, int*/
```
},
```
```
"netStatus": {
```
/*ro, opt, object*/
"@opt": ["connect", "disconnect", "ipConflict"]
/*ro, opt, array, subType:string*/
```
}
```
```
},
```
```
"sipStatus": {
```
/*ro, opt, object*/
"@opt": ["connect", "disconnect", "unregistered"]
/*ro, opt, array, subType:string*/
```
},
```
Hikvision co MMC
adil@hikvision.co.az
```
},
```
```
"ezvizStatus": {
```
/*ro, opt, object*/
"@opt": ["unregistered", "notAdd", "connect"]
/*ro, opt, array, subType:string*/
```
},
```
```
"voipStatus": {
```
/*ro, opt, object*/
"@opt": ["unregistered", "connect"]
/*ro, opt, array, subType:string*/
```
},
```
```
"wifiStatus": {
```
/*ro, opt, object*/
"@opt": ["connect", " disconnect", "connecting", "noModule"]
/*ro, opt, array, subType:string*/
```
},
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/AcsWorkStatus?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"AcsWorkStatus": {
```
/*ro, req, object*/
"doorLockStatus": [1, 2, 1, 2],
```
/*ro, opt, enumarray, door lock status (relay status), subType:int, desc:door lock status (relay status): 0 (normally close), 1 (normally open), 2
```
```
(short-circuit alarm), 3 (broken-circuit alarm), 4 (exception alarm). For example, [1,2,1,2] indicates that door lock 1 is normally open, door lock 2
```
triggers short-circuit alarm, door lock 3 is normally open, and door lock 4 triggers short-circuit alarm*/
"doorStatus": [1, 2, 1, 2],
```
/*ro, opt, enumarray, door (floor) status, subType:int, desc:door (floor) status: 1 (sleep), 2 (remain unlocked (free)), 3 (remain locked
```
```
(disabled)), 4 (normal status (controlled)). For example, [1,2,1,2] indicates that door 1 is sleeping, door 2 remains unlocked, door 3 is sleeping, and door
```
4 remains unlocked*/
"magneticStatus": [1, 2, 1, 2],
```
/*ro, opt, enumarray, magnetic contact status, subType:int, desc:magnetic contact status: 0 (normally close), 1 (normally open), 2 (short-circuit
```
```
alarm), 3 (broken-circuit alarm), 4 (exception alarm). For example, [1,2,1,2] indicates that magnetic contact No.1 is normally open, magnetic contact No.2
```
triggers short-circuit alarm, magnetic contact No.3 is normally open, and magnetic contact No.4 triggers short-circuit alarm*/
"antiSneakStatus": "open",
```
/*ro, opt, enum, anti-passback status, subType:string, desc:"close” (disabled), "open” (enabled)*/
```
"hostAntiDismantleStatus": "open",
```
/*ro, opt, enum, tampering status of the access control device, subType:string, desc:"close” (disabled), "open” (enabled)*/
```
"cardReaderOnlineStatus": [1, 3, 5],
/*ro, opt, array, online status of the authentication unit, subType:int, desc:online status of the authentication unit, e.g., [1,3,5] indicates that
authentication unit No.1, No.3, and No.5 are online*/
"cardReaderAntiDismantleStatus": [1, 3, 5],
/*ro, opt, array, tampering status of the authentication unit, subType:int, desc:tampering status of the authentication unit, e.g., [1,3,5]
indicates that the tampering function of authentication unit No.1, No.3, and No.5 is enabled*/
"cardReaderVerifyMode": [3, 5, 3, 5],
```
/*ro, opt, enumarray, current authentication mode of the authentication unit, subType:int, desc:1 (sleep), 2 (card + password), 3 (card), 4 (card or
```
```
password), 5 (fingerprint), 6 (fingerprint + password), 7 (fingerprint or card), 8 (fingerprint + card), 9 (fingerprint + card + password),10 (face or
```
```
fingerprint or card or password), 11 (face + fingerprint), 12 (face + password), 13 (face + card), 14 (face), 15 (employee No. + password), 16 (fingerprint
```
```
or password), 17 (employee No. + fingerprint), 18 (employee No. + fingerprint + password), 19 (face + fingerprint + card), 20 (face + password +
```
```
fingerprint), 21 (employee No. + face), 22 (face or face + card), 23 (fingerprint or face), 24 (card or face or password), 25 (card or face), 26 (card or
```
```
face or fingerprint), 27 (card or fingerprint or password). For example, [3,5,3,5] indicates that the authentication mode of authentication unit 1 is
```
"card", the authentication mode of authentication unit 2 is "fingerprint", the authentication mode of authentication unit 3 is "card", and the
authentication mode of authentication unit 4 is "fingerprint"*/
"cardNum": 3,
/*ro, opt, int, number of added cards, desc:number of added cards*/
"netStatus": "connect",
/*ro, opt, enum, subType:string*/
"InterfaceStatusList": [
/*ro, opt, array, subType:object*/
```
{
```
"id": 1,
/*ro, opt, int*/
"netStatus": "connect"
/*ro, opt, enum, subType:string*/
```
}
```
],
"ezvizStatus": "unregistered",
/*ro, opt, enum, subType:string*/
"wifiStatus": "connect",
/*ro, opt, enum, subType:string*/
```
}
```
```
}
```
12.5.3.5 Get the working status of the access controller
Hikvision co MMC
adil@hikvision.co.az
Request URL
GET /ISAPI/AccessControl/ClearPictureCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"ClearPictureCfgCap": {
```
/*ro, req, object, clear all pictures in the device*/
```
"ClearFlags": {
```
/*ro, opt, object, clear status*/
```
"facePicture": {
```
/*ro, opt, object, clear registered face pictures*/
"@opt": [true, false]
/*ro, req, array, options, subType:bool*/
```
},
```
```
"capOrVerifyPicture": {
```
/*ro, opt, object, clear authenticated or captured face pictures*/
"@opt": [true, false]
/*ro, req, array, options, subType:bool*/
```
},
```
```
"irisPicture": {
```
/*ro, opt, object, clear registered iris pictures*/
"@opt": [true, false]
/*ro, req, array, options, subType:bool*/
```
}
```
```
}
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/ClearPictureCfg?format=json
Query Parameter
None
Request Message
```
{
```
```
"ClearPictureCfg": {
```
/*req, object, clear picture configuration*/
```
"ClearFlags": {
```
/*opt, object, clear status*/
"facePicture": true,
/*opt, bool, whether it supports clearing registered face pictures in the device*/
"capOrVerifyPicture": true,
/*opt, bool, whether it supports clearing authenticated or captured face pictures stored in the device*/
"irisPicture": true
/*opt, bool, whether to clear registered iris pictures in the device*/
```
}
```
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded); it is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node must be returned when the value of statusCode is not 1*/
```
}
```
12.5.3.6 Get the capability of clearing all pictures in the device
12.5.3.7 Clear all pictures stored in the device
Hikvision co MMC
adil@hikvision.co.az
Request URL
GET /ISAPI/AccessControl/Configuration/lockType/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"LockTypeCap": {
```
/*ro, req, object, the capability of configuring the door lock status when the device is powered off*/
```
"status": {
```
/*ro, opt, object, door lock status when the device is powered off*/
"@opt": ["alwaysOpen", "alwaysClose"]
/*ro, req, array, options, subType:string*/
```
}
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/Configuration/lockType?format=json&doorID=<doorID>
Query Parameter
Parameter Name Parameter Type Description
doorID string --
Request Message
```
{
```
```
"LockType": {
```
/*opt, object, status*/
"status": "alwaysOpen"
/*req, enum, door lock status when the device is powered off, subType:string, desc:"alwaysOpen"-remain open, "alwaysClose"-remain closed*/
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": "test",
/*ro, opt, string, status code*/
"statusString": "test",
/*ro, opt, string, status description*/
"subStatusCode": "test",
/*ro, opt, string, sub status code*/
"errorCode": 1,
/*ro, req, int, error code*/
"errorMsg": "ok"
/*ro, req, string, error information*/
```
}
```
Request URL
GET /ISAPI/AccessControl/Configuration/lockType?format=json&doorID=<doorID>
Query Parameter
12.5.4 Access Control Module Management
12.5.4.1 Get the capability of configuring the door lock status when the device is powered off
12.5.4.2 Set door lock status when the device is powered off
12.5.4.3 Get the configuration of the door lock status when the device is powered off
Hikvision co MMC
adil@hikvision.co.az
Parameter Name Parameter Type Description
doorID string --
Request Message
None
Response Message
```
{
```
```
"LockType": {
```
/*ro, opt, object, status*/
"status": "alwaysOpen"
/*ro, opt, enum, door lock status when the device is powered off, subType:string, desc:door lock status when the device is powered off:
"alwaysOpen"-remain open,"alwaysClose"-remain closed*/
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/Door/param/<doorID>/capabilities
Query Parameter
Parameter Name Parameter Type Description
doorID string Door No.
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<DoorParam xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, attr:version{req, string, protocolVersion}-->
```
<doorNo min="1" max="128">
```
<!--ro, opt, int, door No., attr:min{req, int},max{req, int}, desc:door No.-->1
```
</doorNo>
<doorName min="0" max="32">
```
<!--ro, opt, string, door name, attr:min{req, int},max{req, int}-->test
```
</doorName>
<magneticType opt="alwaysClose,alwaysOpen">
```
<!--ro, opt, enum, magnetic contact type, subType:string, attr:opt{req, string}, desc:"alwaysClose” (remain locked), "alwaysOpen” (remain unlocked)--
```
>alwaysClose
</magneticType>
<openButtonType opt="alwaysClose,alwaysOpen">
```
<!--ro, opt, enum, door button type, subType:string, attr:opt{req, string}, desc:"alwaysClose” (remain locked), "alwaysOpen” (remain unlocked)--
```
>alwaysClose
</openButtonType>
<openDuration min="1" max="255">
```
<!--ro, opt, int, door open duration (floor relay action time), attr:min{req, int},max{req, int}-->1
```
</openDuration>
<disabledOpenDuration min="1" max="255">
```
<!--ro, opt, int, door open duration by disability card (delay duration of closing the door), attr:min{req, int},max{req, int}-->1
```
</disabledOpenDuration>
<magneticAlarmTimeout min="0" max="255">
```
<!--ro, opt, int, alarm time of magnetic contact detection timeout, range:[0,255], unit:s, attr:min{req, int},max{req, int}, desc:alarm time of magnetic
```
contact detection timeout,which is between 0 and 255,0 refers to not triggering alarm,unit: second-->1
</magneticAlarmTimeout>
<enableDoorLock opt="true,false">
```
<!--ro, opt, bool, whether to enable locking door when the door is closed, attr:opt{req, string}-->true
```
</enableDoorLock>
<enableLeaderCard opt="true,false">
```
<!--ro, opt, bool, whether to enable remaining open with first card, attr:opt{req, string}-->true
```
</enableLeaderCard>
<leaderCardMode opt="disable,alwaysOpen,authorize">
```
<!--ro, opt, enum, first card mode, subType:string, attr:opt{req, string}, desc:"disable", "alwaysOpen” (remain open with first card), "authorize”
```
```
(first card authentication)-->disable
```
</leaderCardMode>
<leaderCardOpenDuration min="1" max="1440">
```
<!--ro, opt, int, duration of remaining open with first card, attr:min{req, int},max{req, int}-->1
```
</leaderCardOpenDuration>
<stressPassword min="1" max="8">
```
<!--ro, opt, string, duress password, attr:min{req, int},max{req, int}, desc:the maximum length is 8 bytes, and the duress password should be encoded by
```
Base64 for transmission-->test
</stressPassword>
<superPassword min="1" max="8">
12.5.4.4 Get the door configuration capability
Hikvision co MMC
adil@hikvision.co.az
<superPassword min="1" max="8">
```
<!--ro, opt, string, super password, attr:min{req, int},max{req, int}, desc:the maximum length is 8 bytes, and the duress password should be encoded by
```
Base64 for transmission-->test
</superPassword>
<unlockPassword min="1" max="8">
```
<!--ro, opt, string, dismiss password,t, attr:min{req, int},max{req, int}, desc:the maximum length is 8 bytes, and the duress password should be encoded
```
by Base64 for transmission-->test
</unlockPassword>
<useLocalController opt="true,false">
```
<!--ro, opt, bool, whether it is connected to the distributed controller, attr:opt{req, string}-->true
```
</useLocalController>
<localControllerID min="0" max="64">
```
<!--ro, opt, int, distributed controller No., range:[0,64], attr:min{req, int},max{req, int}, desc:ro,distributed controller No.,which is between 1 and
```
64,0-unregistered-->1
</localControllerID>
<localControllerDoorNumber min="0" max="4">
```
<!--ro, opt, int, distributed controller door No., range:[0,4], attr:min{req, int},max{req, int}, desc:ro,distributed controller door No.,which is
```
between 1 and 4,0-unregistered-->1
</localControllerDoorNumber>
<localControllerStatus opt="0,1,2,3,4,5,6,7,8,9">
```
<!--ro, opt, enum, online status of the distributed controller, subType:int, attr:opt{req, string}, desc:0-offline, 1-network online, 2-RS-485 serial
```
port 1 on loop circuit 1, 3-RS-485 serial port 2 on loop circuit 1, 4-RS-485 serial port 1 on loop circuit 2, 5-RS-485 serial port 2 on loop circuit 2, 6-
RS-485 serial port 1 on loop circuit 3, 7-RS-485 serial port 2 on loop circuit 3,8-RS-485 serial port 1 on loop circuit 4, 9-RS-485 serial port 2 on loop
circuit 4-->1
</localControllerStatus>
<lockInputCheck opt="true,false">
```
<!--ro, opt, bool, whether to enable door lock input detection, attr:opt{req, string}-->true
```
</lockInputCheck>
<lockInputType opt="alwaysClose,alwaysOpen">
```
<!--ro, opt, enum, door lock input type, subType:string, attr:opt{req, string}, desc:"alwaysClose” (remain locked), "alwaysOpen” (remain unlocked)--
```
>alwaysClose
</lockInputType>
<doorTerminalMode opt="preventCutAndShort,preventCutAndShort,common">
```
<!--ro, opt, enum, working mode of door terminal, subType:string, attr:opt{req, string}, desc:working mode of door terminal: "preventCutAndShort"-
```
```
prevent from broken-circuit and short-circuit (default),"common"-->preventCutAndShort
```
</doorTerminalMode>
<openButton opt="true,false">
```
<!--ro, opt, bool, whether to enable door button, attr:opt{req, string}, desc:whether to enable door button: "true"-yes (default),"false"-no-->true
```
</openButton>
<ladderControlDelayTime min="1" max="255">
```
<!--ro, opt, int, elevator control delay time (for visitor), attr:min{req, int},max{req, int}-->1
```
</ladderControlDelayTime>
<Leader>
<!--ro, opt, object-->
<continuousVerificationTimes min="1" max="10">
```
<!--ro, opt, int, range:[1,10], attr:min{req, int},max{req, int}-->1
```
</continuousVerificationTimes>
<continuousVerificationDuration min="1" max="10">
```
<!--ro, opt, int, range:[5,60], unit:s, attr:min{req, int},max{req, int}-->20
```
</continuousVerificationDuration>
<effectiveTimeEnabled opt="true,false">
```
<!--ro, req, bool, attr:opt{req, string}-->true
```
</effectiveTimeEnabled>
<dayBeginTime>
```
<!--ro, opt, time, dep:and,{$.DoorParam.Leader.effectiveTimeEnabled,eq,true}-->00:00:00
```
</dayBeginTime>
<beginEffectiveTime>
```
<!--ro, opt, time, dep:and,{$.DoorParam.Leader.effectiveTimeEnabled,eq,true}-->00:00:00
```
</beginEffectiveTime>
<endEffectiveTime>
```
<!--ro, opt, time, dep:and,{$.DoorParam.Leader.effectiveTimeEnabled,eq,true}-->00:00:00
```
</endEffectiveTime>
</Leader>
<verificationPassOpenDoor opt="true,false">
```
<!--ro, opt, bool, attr:opt{req, string}-->true
```
</verificationPassOpenDoor>
<relayReverseEnabled opt="true,false" def="false">
```
<!--ro, opt, bool, attr:opt{req, string},def{req, bool}-->true
```
</relayReverseEnabled>
<regionNodeID min="0" max="32">
```
<!--ro, opt, string, attr:min{req, int},max{req, int}-->test
```
</regionNodeID>
<method opt="batchPut">
```
<!--ro, opt, string, attr:opt{req, string}-->batchPut
```
</method>
<doorCfgType opt="all,byDoor,byRegion,byDoorSeparate">
```
<!--ro, opt, string, attr:opt{req, string}-->all
```
</doorCfgType>
<hostDoorNo min="1" max="4">
```
<!--ro, opt, int, attr:min{req, int},max{req, int}-->1
```
</hostDoorNo>
<doorAddedFlag opt="true,false">
```
<!--ro, opt, bool, attr:opt{req, string}-->true
```
</doorAddedFlag>
<preCloseDoorEnabled opt="true,false">
```
<!--ro, opt, bool, attr:opt{req, string}-->true
```
</preCloseDoorEnabled>
<preCloseDoorTime min="0" max="255">
```
<!--ro, opt, int, unit:s, attr:min{req, int},max{req, int}-->1
```
</preCloseDoorTime>
<passingDetectEnabled opt="true,false">
```
<!--ro, opt, bool, attr:opt{req, string}-->true
```
</passingDetectEnabled>
<doorNotClosedAlarmEnabled opt="true,false">
```
<!--ro, opt, bool, attr:opt{req, string}-->true
```
Hikvision co MMC
adil@hikvision.co.az
```
<!--ro, opt, bool, attr:opt{req, string}-->true
```
</doorNotClosedAlarmEnabled>
<doorNotClosedAlarmText min="0" max="128">
```
<!--ro, opt, string, range:[0,128], attr:min{req, int},max{req, int}-->test
```
</doorNotClosedAlarmText>
<nonStopFloorEnabled opt="true,false">
```
<!--ro, opt, bool, attr:opt{req, string}-->false
```
</nonStopFloorEnabled>
<localExtensionDoorInfoList>
<!--ro, opt, object-->
<localExtensionDoorInfo>
<!--ro, req, object-->
<devType>
<!--ro, req, enum, subType:string-->2doors
</devType>
<devNum>
<!--ro, req, int-->2
</devNum>
</localExtensionDoorInfo>
</localExtensionDoorInfoList>
<closeDoorMode opt="auto,manual">
```
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->auto
```
</closeDoorMode>
</DoorParam>
Request URL
PUT /ISAPI/AccessControl/Door/param/<doorID>
Query Parameter
Parameter Name Parameter Type Description
doorID string --
Request Message
<?xml version="1.0" encoding="UTF-8"?>
<DoorParam xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--req, object, door parameter, attr:version{req, string, protocolVersion}-->
```
<doorName>
<!--opt, string, door name-->test
</doorName>
<magneticType>
```
<!--opt, enum, door magnetic sensor type, subType:string, desc:"alwaysClose” (remain locked), "alwaysOpen” (remain unlocked)-->alwaysClose
```
</magneticType>
<openButtonType>
```
<!--opt, enum, open door button type, subType:string, desc:"alwaysClose” (remain locked), "alwaysOpen” (remain unlocked)-->alwaysClose
```
</openButtonType>
<openDuration>
<!--opt, int, door open duration, range:[1,255], unit:s-->1
</openDuration>
<disabledOpenDuration>
```
<!--opt, int, door open duration by disability card (delay duration of closing the door), range:[1,255], unit:s-->1
```
</disabledOpenDuration>
<magneticAlarmTimeout>
<!--opt, int, alarm time of magnetic contact detection timeout, range:[0,255], unit:s, desc:0 refers to not triggering alarm-->1
</magneticAlarmTimeout>
<enableDoorLock>
<!--opt, bool, lock door when door closed-->true
</enableDoorLock>
<enableLeaderCard>
<!--opt, bool, whether to enable remaining open with first card-->true
</enableLeaderCard>
<leaderCardMode>
<!--opt, enum, first card mode, subType:string, desc:first card mode: "disable","alwaysOpen"-remain open with first card,"authorize"-first card
authentication. If this node is configured,the node <enableLeaderCard> is invalid-->disable
</leaderCardMode>
<leaderCardOpenDuration>
```
<!--opt, int, duration of remaining open with first card, range:[0,1440], unit:min, dep:and,{$.DoorParam.leaderCardMode,eq,alwaysOpen}-->1
```
</leaderCardOpenDuration>
<stressPassword>
<!--opt, string, duress password, desc:the maximum length is 8 bytes, and the duress password should be encoded by Base64 for transmission-->test
</stressPassword>
<superPassword>
<!--opt, string, super password, desc:the maximum length is 8 bytes, and the duress password should be encoded by Base64 for transmission-->test
</superPassword>
<unlockPassword>
<!--opt, string, unlock password, desc:the maximum length is 8 bytes, and the duress password should be encoded by Base64 for transmission-->test
</unlockPassword>
<useLocalController>
<!--opt, bool, whether it is connected to the distributed controller-->true
</useLocalController>
<localControllerID>
<!--opt, int, distributed controller No., range:[0,64], desc:ro,distributed controller No.,which is between 1 and 64,0-unregistered-->1
```
12.5.4.5 Set the door (floor) parameters
```
Hikvision co MMC
adil@hikvision.co.az
<!--opt, int, distributed controller No., range:[0,64], desc:ro,distributed controller No.,which is between 1 and 64,0-unregistered-->1
</localControllerID>
<localControllerDoorNumber>
<!--opt, int, distributed controller door No., range:[0,4], desc:ro,distributed controller door No.,which is between 1 and 4,0-unregistered-->1
</localControllerDoorNumber>
<localControllerStatus>
<!--opt, enum, online status of the distributed controller, subType:int, desc:ro,online status of the distributed controller: 0-offline,1-network
online,2-RS-485 serial port 1 on loop circuit 1,3-RS-485 serial port 2 on loop circuit 1,4-RS-485 serial port 1 on loop circuit 2,5-RS-485 serial port 2 on
loop circuit 2,6-RS-485 serial port 1 on loop circuit 3,7-RS-485 serial port 2 on loop circuit 3,8-RS-485 serial port 1 on loop circuit 4,9-RS-485 serial
port 2 on loop circuit 4-->1
</localControllerStatus>
<lockInputCheck>
<!--opt, bool, whether to enable door lock input detection-->true
</lockInputCheck>
<lockInputType>
```
<!--opt, enum, door lock input type, subType:string, desc:"alwaysClose” (remain locked), "alwaysOpen” (remain unlocked), lt remains locked by default--
```
>alwaysClose
</lockInputType>
<doorTerminalMode>
```
<!--opt, enum, working mode of door terminal, subType:string, desc:"preventCutAndShort” (prevent from broken-circuit and short-circuit
```
```
(default)),"common"-->preventCutAndShort
```
</doorTerminalMode>
<openButton>
<!--opt, bool, whether to enable door button-->true
</openButton>
<ladderControlDelayTime>
```
<!--opt, int, elevator control delay time (for visitor), range:[1,255], unit:min-->1
```
</ladderControlDelayTime>
<Leader>
<!--opt, object-->
<continuousVerificationTimes>
<!--opt, int, range:[1,10]-->1
</continuousVerificationTimes>
<continuousVerificationDuration>
<!--opt, int, range:[5,60], unit:s-->20
</continuousVerificationDuration>
<effectiveTimeEnabled>
<!--req, bool-->true
</effectiveTimeEnabled>
<dayBeginTime>
```
<!--opt, time, dep:and,{$.DoorParam.Leader.effectiveTimeEnabled,eq,true}-->00:00:00
```
</dayBeginTime>
<beginEffectiveTime>
```
<!--opt, time, dep:and,{$.DoorParam.Leader.effectiveTimeEnabled,eq,true}-->00:00:00
```
</beginEffectiveTime>
<endEffectiveTime>
```
<!--opt, time, dep:and,{$.DoorParam.Leader.effectiveTimeEnabled,eq,true}-->00:00:00
```
</endEffectiveTime>
</Leader>
<verificationPassOpenDoor>
<!--opt, bool-->true
</verificationPassOpenDoor>
<relayReverseEnabled>
<!--opt, bool-->true
</relayReverseEnabled>
</DoorParam>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status description, subType:string, desc:“OK” (succeeded), “Device Busy”, “Device Error”, “Invalid Operation”, “Invalid XML Format”,
```
```
“Invalid XML Content”, “Reboot” (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, error code description, desc:error code description-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/AccessControl/Door/param/<doorID>
Query Parameter
```
12.5.4.6 Get the door (floor) configuration parameters
```
Hikvision co MMC
adil@hikvision.co.az
Parameter Name Parameter Type Description
```
doorID string Door No. (floor No.), which starts from 1.
```
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<DoorParam xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, attr:version{req, string, protocolVersion}-->
```
<doorName>
<!--ro, opt, string, door name-->test
</doorName>
<magneticType>
<!--ro, opt, enum, magnetic contact type, subType:string, desc:"alwaysClose"-remain locked, "alwaysOpen"-remain unlocked-->alwaysClose
</magneticType>
<openButtonType>
<!--ro, opt, enum, door button type, subType:string, desc:"alwaysClose"-remain locked, "alwaysOpen"-remain unlocked-->alwaysClose
</openButtonType>
<openDuration>
<!--ro, opt, int, door open duration, range:[1,255], unit:s-->1
</openDuration>
<disabledOpenDuration>
```
<!--ro, opt, int, door open duration by disability card (delay duration of closing the door), range:[1,255], unit:s-->1
```
</disabledOpenDuration>
<magneticAlarmTimeout>
<!--ro, opt, int, alarm time of magnetic contact detection timeout, range:[0,255], unit:s, desc:0 refers to not triggering alarm-->1
</magneticAlarmTimeout>
<enableDoorLock>
<!--ro, opt, bool, whether to enable locking door when the door is closed-->true
</enableDoorLock>
<enableLeaderCard>
<!--ro, opt, bool, whether to enable remaining open with first card. This node is invalid when leaderCardMode is configured-->true
</enableLeaderCard>
<leaderCardMode>
<!--ro, opt, enum, first card mode, subType:string, desc:"disable","alwaysOpen"-remain open with first card,"authorize"-first card authentication. If
this node is configured,the node <enableLeaderCard> is invalid-->disable
</leaderCardMode>
<leaderCardOpenDuration>
```
<!--ro, opt, int, duration of remaining open with first card, range:[0,1440], unit:min, dep:and,{$.DoorParam.leaderCardMode,eq,alwaysOpen}-->1
```
</leaderCardOpenDuration>
<stressPassword>
<!--ro, opt, string, duress password, desc:the maximum length is 8 bytes, and the duress password should be encoded by Base64 for transmission-->test
</stressPassword>
<superPassword>
<!--ro, opt, string, super password, desc:wo,super password,the maximum length is 8 bytes,and the super password should be encoded by Base64 for
transmission-->test
</superPassword>
<unlockPassword>
<!--ro, opt, string, dismiss password, desc:the maximum length is 8 bytes, and the dismiss password should be encoded by Base64 for transmission-->test
</unlockPassword>
<useLocalController>
<!--ro, opt, bool, whether it is connected to the distributed controller-->true
</useLocalController>
<localControllerID>
<!--ro, opt, int, distributed controller No., which is between 1 and 64, range:[0,64], desc:0-unregistered-->1
</localControllerID>
<localControllerDoorNumber>
<!--ro, opt, int, distributed controller door No., range:[0,4], desc:0-unregistered-->1
</localControllerDoorNumber>
<localControllerStatus>
<!--ro, opt, enum, online status of the distributed controller, subType:int, desc:0-offline,1-network online,2-RS-485 serial port 1 on loop circuit 1,3-
RS-485 serial port 2 on loop circuit 1,4-RS-485 serial port 1 on loop circuit 2,5-RS-485 serial port 2 on loop circuit 2,6-RS-485 serial port 1 on loop
circuit 3,7-RS-485 serial port 2 on loop circuit 3,8-RS-485 serial port 1 on loop circuit 4,9-RS-485 serial port 2 on loop circuit 4-->1
</localControllerStatus>
<lockInputCheck>
<!--ro, opt, bool, whether to enable door lock input detection-->true
</lockInputCheck>
<lockInputType>
```
<!--ro, opt, enum, door lock input type, subType:string, desc:"alwaysClose"-remain locked (default), "alwaysOpen"-remain unlocked-->alwaysClose
```
</lockInputType>
<doorTerminalMode>
<!--ro, opt, enum, working mode of door terminal, subType:string, desc:"preventCutAndShort"-prevent from broken-circuit and short-circuit
```
(default),"common”-->preventCutAndShort
```
</doorTerminalMode>
<openButton>
```
<!--ro, opt, bool, whether to enable door button: "true"-yes (default), "false"-no-->true
```
</openButton>
<ladderControlDelayTime>
```
<!--ro, opt, int, elevator control delay time (for visitor), range:[1,255], unit:min-->1
```
</ladderControlDelayTime>
<Leader>
<!--ro, opt, object-->
<continuousVerificationTimes>
<!--ro, opt, int, range:[1,10]-->1
</continuousVerificationTimes>
Hikvision co MMC
adil@hikvision.co.az
</continuousVerificationTimes>
<continuousVerificationDuration>
<!--ro, opt, int, range:[5,60], unit:s-->20
</continuousVerificationDuration>
<effectiveTimeEnabled>
<!--ro, req, bool-->true
</effectiveTimeEnabled>
<dayBeginTime>
```
<!--ro, opt, time, dep:and,{$.DoorParam.Leader.effectiveTimeEnabled,eq,true}-->00:00:00
```
</dayBeginTime>
<beginEffectiveTime>
```
<!--ro, opt, time, dep:and,{$.DoorParam.Leader.effectiveTimeEnabled,eq,true}-->00:00:00
```
</beginEffectiveTime>
<endEffectiveTime>
```
<!--ro, opt, time, dep:and,{$.DoorParam.Leader.effectiveTimeEnabled,eq,true}-->00:00:00
```
</endEffectiveTime>
</Leader>
<verificationPassOpenDoor>
<!--ro, opt, bool-->true
</verificationPassOpenDoor>
<relayReverseEnabled>
<!--ro, opt, bool-->true
</relayReverseEnabled>
<regionNodeID>
<!--ro, opt, string, range:[1,32]-->test
</regionNodeID>
<doorAddedFlag>
<!--ro, opt, bool-->true
</doorAddedFlag>
<preCloseDoorEnabled>
<!--ro, opt, bool-->true
</preCloseDoorEnabled>
<preCloseDoorTime>
```
<!--ro, opt, int, range:[0,255], unit:s, dep:and,{$.DoorParam.preCloseDoorEnabled,eq,true}-->1
```
</preCloseDoorTime>
<passingDetectEnabled>
<!--ro, opt, bool-->true
</passingDetectEnabled>
<doorNotClosedAlarmEnabled>
<!--ro, opt, bool-->true
</doorNotClosedAlarmEnabled>
<doorNotClosedAlarmText>
```
<!--ro, opt, string, range:[0,128], dep:or,{$.DoorParam.doorNotClosedAlarmEnabled,eq,true}-->test
```
</doorNotClosedAlarmText>
<nonStopFloorEnabled>
<!--ro, opt, bool-->false
</nonStopFloorEnabled>
<closeDoorMode>
<!--ro, opt, enum, subType:string-->auto
</closeDoorMode>
</DoorParam>
Request URL
GET /ISAPI/AccessControl/DoorSecurityModule/moduleStatus
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ModuleStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, module status, attr:version{req, string, protocolVersion}-->
```
<securityModuleNo min="1" max="256">
```
<!--ro, req, string, secure door control unit No., attr:min{req, int},max{req, int}-->test
```
</securityModuleNo>
<onlineStatus opt="0,1">
```
<!--ro, req, enum, online status, subType:int, attr:opt{req, string}, desc:0 (offline), 1(online)-->1
```
</onlineStatus>
<desmantelStatus opt="0,1">
```
<!--ro, req, enum, tamper-proof status, subType:int, attr:opt{req, string}, desc:0 (the unit is not tampered), 1(the unit is tampered)-->1
```
</desmantelStatus>
</ModuleStatus>
Request URL
12.5.4.7 Get the status of the secure door control unit
12.5.4.8 Get the capability of getting the status of the secure door control unit
Hikvision co MMC
adil@hikvision.co.az
GET /ISAPI/AccessControl/DoorSecurityModule/moduleStatus/capabilities
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ModuleStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, module status, attr:version{req, string, protocolVersion}-->
```
<securityModuleNo min="1" max="256">
```
<!--ro, req, string, secure door control unit No., attr:min{req, int},max{req, int}-->test
```
</securityModuleNo>
<onlineStatus opt="0,1">
```
<!--ro, req, enum, online status, subType:int, attr:opt{req, string}, desc:0 (offline), 1 (online)-->1
```
</onlineStatus>
<desmantelStatus opt="0,1">
```
<!--ro, req, enum, tampering status, subType:int, attr:opt{req, string}, desc:0 (the unit is not tampered), 1 (the unit is tampered)-->1
```
</desmantelStatus>
</ModuleStatus>
Request URL
GET /ISAPI/AccessControl/AntiSneakCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"AntiSneakCfg": {
```
/*ro, req, object*/
"enable": "true,false",
/*ro, req, string, whether to enable anti-passing back*/
```
"startCardReaderNo": {
```
/*ro, opt, object, first card reader No., desc:first card reader No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 4,
/*ro, opt, int, the maximum value*/
"@opt": [1, 4]
/*ro, opt, array, subType:int*/
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/AntiSneakCfg?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.5 Anti-Passback
12.5.5.1 Get the anti-passing back configuration capability
12.5.5.2 Get the parameters of anti-passback configuration
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"AntiSneakCfg": {
```
/*ro, req, object*/
"enable": true,
/*ro, req, bool, whether to enable anti-passback*/
"startCardReaderNo": 1
/*ro, opt, int, first card reader No., desc:first card reader No.,0-no first card reader*/
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/AntiSneakCfg?format=json
Query Parameter
None
Request Message
```
{
```
```
"AntiSneakCfg": {
```
/*req, object*/
"enable": true,
/*req, bool, whether to enable anti-passing back*/
"startCardReaderNo": 1
/*opt, int, first card reader No., desc:0-no first card reader*/
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/CardReaderAntiSneakCfg/<cardReaderID>?format=json
Query Parameter
Parameter Name Parameter Type Description
cardReaderID string Card reader ID
Request Message
None
Response Message
12.5.5.3 Set the anti-passing back parameters
12.5.5.4 Get the anti-passing back configuration parameters of a specified card readerHikvision co MMC
adil@hikvision.co.az
```
{
```
```
"CardReaderAntiSneakCfg": {
```
/*ro, req, object*/
"enable": true,
```
/*ro, req, bool, whether to enable the anti-passing back function of the card reader, desc:"true" (enable), "false" (disable)*/
```
"followUpCardReader": [2, 3, 4]
/*ro, opt, array, following card reader No. after the first card reader, subType:int, desc:[2,3,4] indicates that card reader No. 2, No. 3, or No. 4
can be swiped after the first card reader*/
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/CardReaderAntiSneakCfg/<cardReaderID>?format=json
Query Parameter
Parameter Name Parameter Type Description
cardReaderID string --
Request Message
```
{
```
```
"CardReaderAntiSneakCfg": {
```
/*req, object, anti-passing back parameters of a card reader*/
"enable": true,
/*req, bool, whether to enable the anti-passing back function of the card reader, desc:"true"-enable, "false"-disable*/
"followUpCardReader": [2, 3, 4]
/*opt, array, following card reader No. after the first card reader, subType:int, desc:e.g., [2,3,4] indicates that card reader No. 2, No. 3, and
No. 4 can be swiped after the first card reader*/
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded); it is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/CardReaderAntiSneakCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.5.5 Set anti-passing back parameters of a card reader
12.5.5.6 Get the configuration capability of anti-passing back parameters of card readers
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"CardReaderAntiSneakCfg": {
```
/*ro, req, object*/
```
"cardReaderNo": {
```
/*ro, opt, object, card reader No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 512,
/*ro, opt, int, the maximum value*/
"@opt": [1, 4]
/*ro, opt, array, subType:int*/
```
},
```
"enable": "true,false",
/*ro, req, string, whether to enable the anti-passing back function of the card reader*/
```
"followUpCardReader": {
```
/*ro, opt, object, array,following card reader No. after the first card reader*/
"@min": 1,
/*ro, opt, int*/
"@max": 512,
/*ro, opt, int*/
"@opt": [1, 4]
/*ro, opt, array, subType:int*/
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/ClearAntiSneak/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"ClearAntiSneak": {
```
/*ro, req, object*/
```
"EmployeeNoList": {
```
/*ro, opt, object*/
"maxSize": 32,
/*ro, opt, int*/
```
"employeeNo": {
```
```
/*ro, opt, object, employee No. (person ID)*/
```
"@min": 1,
/*ro, opt, int*/
"@max": 32
/*ro, opt, int*/
```
}
```
```
},
```
```
"clearMode": {
```
/*ro, opt, object*/
"@opt": ["employeeNo", "all"]
/*ro, opt, array, subType:string*/
```
}
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/ClearAntiSneak?format=json
Query Parameter
None
Request Message
12.5.5.7 Get the capability of clearing anti-passback records
12.5.5.8 Clear anti-passback records in the device
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"ClearAntiSneak": {
```
/*req, object, clear anti-passback records, desc:clear anti-passback records*/
"EmployeeNoList": [
/*opt, array, person ID list, subType:object, desc:person ID list*/
```
{
```
"employeeNo": "test"
```
/*req, string, employee No. (person ID)*/
```
```
}
```
],
"clearMode": "employeeNo"
/*opt, enum, clearing mode, subType:string, desc:clearing mode*/
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "OK",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:it is required when the value of statusCode is not 1, and it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/ClearAntiSneakCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"ClearAntiSneakCfg": {
```
/*ro, req, object, the capability of clearing anti-passback*/
```
"ClearFlags": {
```
/*ro, req, object*/
"antiSneak": "true,false"
/*ro, req, string, whether to clear the anti-passback parameter*/
```
}
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/ClearAntiSneakCfg?format=json
Query Parameter
None
Request Message
12.5.5.9 Get the capability of clearing anti-passback parameters
12.5.5.10 Clear anti-passing back parameters
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"ClearAntiSneakCfg": {
```
/*req, object*/
```
"ClearFlags": {
```
/*req, object*/
"antiSneak": true
/*req, bool, whether to clear the anti-passing back parameters*/
```
}
```
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded); it is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
PUT /ISAPI/AccessControl/CardReaderPlan/<cardReaderID>?format=json
Query Parameter
Parameter Name Parameter Type Description
cardReaderID string --
Request Message
```
{
```
```
"CardReaderPlan": {
```
/*req, object*/
"templateNo": 1
```
/*req, int, schedule template No., desc:0-cancel linking the template to the schedule and restore to the default status (normal status)*/
```
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded); it is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node must be returned when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/CardReaderPlan/<cardReaderID>?format=json
Query Parameter
12.5.6 Authentication Schedule Management
12.5.6.1 Set control schedule parameters of card reader authentication mode
12.5.6.2 Get the control schedule configuration parameters of the card reader authentication mode
Hikvision co MMC
adil@hikvision.co.az
Parameter
Name
Parameter
Type Description
cardReaderID string Card reader No., which starts from 1, and the maximum value supported by the device isobtained from the capability set.
Request Message
None
Response Message
```
{
```
```
"CardReaderPlan": {
```
/*ro, req, object, schedule template structure*/
"templateNo": 1
```
/*ro, req, int, schedule template number, desc:0-cancel linking the template to the schedule and restore to the default status (normal status)*/
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/CardReaderPlan/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"CardReaderPlan": {
```
/*ro, opt, object, card reader No. node*/
```
"cardReaderNo": {
```
/*ro, opt, object, card reader No.*/
"@min": 1,
/*ro, opt, int*/
"@max": 4
/*ro, opt, int*/
```
},
```
```
"templateNo": {
```
/*ro, opt, object, schedule template No. node*/
"@min": 1,
/*ro, opt, int*/
"@max": 16,
/*ro, opt, int*/
"@opt": [65535, 65534, 65533]
/*ro, opt, array, subType:int*/
```
},
```
```
"verifyMode": {
```
```
/*ro, opt, object, authentication mode, dep:and,{$.CardReaderPlan.templateNo.@opt[*],eq,65535}*/
```
"@opt":
"cardAndPw,card,cardOrPw,fp,fpAndPw,fpOrCard,fpAndCard,fpAndCardAndPw,faceOrFpOrCardOrPw,faceAndFp,faceAndPw,faceAndCard,face,employeeNoAndPw,fpOrPw,employe
eNoAndFp,employeeNoAndFpAndPw,faceAndFpAndCard,faceAndPwAndFp,employeeNoAndFace,faceOrfaceAndCard,fpOrface,cardOrfaceOrPw,cardOrFace,cardOrFaceOrFp,cardOrFp
OrPw,faceOrPw,employeeNoAndFaceAndPw,cardOrFaceOrFaceAndCard,iris,faceOrFpOrCardOrPwOrIris,faceOrCardOrPwOrIris,sleep,invalid"
```
/*ro, opt, string, desc:"cardAndPw” (card + password), "card” (card), "cardOrPw” (card or password), "fp” (fingerprint), "fpAndPw” (fingerprint
```
- password), "fpOrCard” (fingerprint or card), "fpAndCard” (fingerprint + card), "fpAndCardAndPw” (fingerprint + card + password), "faceOrFpOrCardOrPw”
```
(face or fingerprint or card or password), "faceAndFp” (face + fingerprint), "faceAndPw” (face + password), "faceAndCard” (face + card), "face” (face),
```
```
"employeeNoAndPw” (employee No. + password), "fpOrPw” (fingerprint or password), "employeeNoAndFp” (employee No. + fingerprint), "employeeNoAndFpAndPw”
```
```
(employee No. + fingerprint + password), "faceAndFpAndCard” (face + fingerprint + card), "faceAndPwAndFp” (face + password + fingerprint),
```
```
"employeeNoAndFace” (employee No. + face), "faceOrfaceAndCard” (face or face + card), "fpOrface” (fingerprint or face), "cardOrfaceOrPw” (card or face or
```
```
password), "cardOrFace” (card or face), "cardOrFaceOrFp” (card or face or fingerprint), "cardOrFpOrPw” (card or fingerprint or password), "faceOrPw" (face
```
```
or password), "employeeNoAndFaceAndPw" (employee No. + face + card), "cardOrFaceOrFaceAndCard" (card or face or face + card), "iris",
```
```
"faceOrFpOrCardOrPwOrIris"(face or fingerprint or card or password or iris), "faceOrCardOrPwOrIris" (face or card or password or iris), "sleep",
```
"invalid"*/
```
}
```
```
}
```
```
}
```
Request URL
12.5.6.3 Get the control schedule configuration capability of the card reader authentication mode
12.5.6.4 Get the holiday group configuration parameters of the control schedule of the card reader
authentication mode
Hikvision co MMC
adil@hikvision.co.az
GET /ISAPI/AccessControl/VerifyHolidayGroupCfg/<holidayGroupID>?format=json
Query Parameter
Parameter
Name
Parameter
Type Description
holidayGroupID string Holiday group No., which starts from 1, and the maximum value supported by thedevice is obtained from the capability set.
Request Message
None
Response Message
```
{
```
```
"VerifyHolidayGroupCfg": {
```
/*ro, opt, object*/
"enable": true,
```
/*ro, req, bool, whether to enable, desc:true (yes), false-no (default)*/
```
"groupName": "test",
/*ro, req, string, holiday group name*/
"holidayPlanNo": "1,3,5"
/*ro, opt, string, holiday group schedule No., desc:holiday group schedule No.*/
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/VerifyHolidayGroupCfg/<holidayGroupID>?format=json
Query Parameter
Parameter Name Parameter Type Description
holidayGroupID string --
Request Message
```
{
```
```
"VerifyHolidayGroupCfg": {
```
/*opt, object, holiday group parameters of control schedule of card reader authentication mode*/
"enable": true,
/*req, bool, whether to enable, desc:"true"-enable, "false"-disable*/
"groupName": "test",
/*req, string, holiday group name*/
"holidayPlanNo": "1,3,5"
/*opt, string, holiday group schedule No., desc:holiday group schedule No.*/
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded); it is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node must be returned when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/VerifyHolidayGroupCfg/capabilities?format=json
12.5.6.5 Set holiday group parameters of control schedule of card reader authentication mode
12.5.6.6 Get the holiday group configuration capability of the control schedule of the card reader
authentication mode
Hikvision co MMC
adil@hikvision.co.az
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"VerifyHolidayGroupCfg": {
```
/*ro, opt, object*/
```
"groupNo": {
```
/*ro, opt, object, holiday group No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
},
```
"enable": "true,false",
/*ro, opt, string, whether to enable, desc:whether to enable: "true"-enable,"false"-disable*/
```
"groupName": {
```
/*ro, opt, object, length of holiday group name*/
"@min": 1,
/*ro, opt, int, the minimum length*/
"@max": 32
/*ro, opt, int, the maximum length*/
```
},
```
```
"holidayPlanNo": {
```
/*ro, opt, object, holiday group schedule No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/VerifyHolidayPlanCfg/<holidayPlanID>?format=json
Query Parameter
Parameter
Name
Parameter
Type Description
holidayPlanID string Holiday schedule No., which starts from 1, and the maximum value supported by thedevice is obtained from the capability set.
Request Message
None
Response Message
12.5.6.7 Get holiday schedule parameters of the card reader authentication mode
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"VerifyHolidayPlanCfg": {
```
/*ro, opt, object, holiday schedule parameters of the card reader authentication mode*/
"enable": true,
```
/*ro, req, bool, whether to enable, desc:true (enable), false (disable)*/
```
"beginDate": "1970-01-01",
/*ro, req, date, start date of the holiday, desc:device local time*/
"endDate": "1970-01-02",
/*ro, req, date, end date of the holiday, desc:device local time*/
"HolidayPlanCfg": [
/*ro, req, array, holiday schedule parameters, subType:object*/
```
{
```
"id": 1,
/*ro, req, int, time period No., range:[1,8]*/
"enable": true,
```
/*ro, req, bool, whether to enable the holiday schedule, desc:true (enable), false (disable)*/
```
"verifyMode": "cardAndPw",
```
/*ro, req, enum, authentication mode, subType:string, desc:"cardAndPw" (card+password), "card" (card), "cardOrPw" (card or password), "fp"
```
```
(fingerprint), "fpAndPw" (fingerprint+password), "fpOrCard" (fingerprint or card), "fpAndCard" (fingerprint+card), "fpAndCardAndPw"
```
```
(fingerprint+card+password), "faceOrFpOrCardOrPw" (face or fingerprint or card or password), "faceAndFp" (face+fingerprint), "faceAndPw" (face+password),
```
```
"faceAndCard" (face+card), "face" (face), "employeeNoAndPw" (employee No.+password), "fpOrPw" (fingerprint or password), "employeeNoAndFp" (employee
```
```
No.+fingerprint), "employeeNoAndFpAndPw" (employee No.+fingerprint+password), "faceAndFpAndCard" (face+fingerprint+card), "faceAndPwAndFp"
```
```
(face+password+fingerprint), "employeeNoAndFace" (employee No.+face), "faceOrfaceAndCard" (face or face+card), "fpOrface" (fingerprint or face),
```
```
"cardOrfaceOrPw" (card or face or password), "cardOrFace" (card or face), "cardOrFaceOrFp" (card or face or fingerprint), "cardOrFpOrPw" (card or
```
```
fingerprint or password), "iris" (iris), "faceOrFpOrCardOrPwOrIris" (face or fingerprint or card or password or iris), "faceOrCardOrPwOrIris" (face or card
```
```
or password or iris), "cardOrFace" (card or face), "cardOrFaceOrFp" (card or face or password), "faceOrPw" (face or password), "employeeNoAndFaceAndPw"
```
```
(employee No.+face+password), "cardOrFaceOrFaceAndCard" (card or face or face+card), "faceOrFpOrPw" (face or fingerprint or password),
```
```
"cardOrFpOrFaceOrIris" (card or fingerpriont or face or iris), "fpOrFaceOrIrisOrPw" (fingerprint or face or iris or password), "cardOrFpOrIrisOrPw" (card or
```
```
fingerprint or iris or password), "cardOrIrisOrPw" (card or iris or password), "cardAndIris" (card+ris), "fpAndIri" (fingerprint+iris), "faceAndIris"
```
```
(face+iris), "irisAndPw" (iris+password), "cardAndIrisAndPw" (card+iris+password), "faceAndIrisAndPw" (face+iris+password), "cardAndFaceAndIris"
```
```
(card+face+iris)*/
```
```
"TimeSegment": {
```
/*ro, opt, object, time*/
"beginTime": "00:00:00",
/*ro, req, time, start time of the time period, desc:device local time*/
"endTime": "10:00:00"
/*ro, req, time, end time of the time period, desc:device local time*/
```
}
```
```
}
```
]
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/VerifyHolidayPlanCfg/<holidayPlanID>?format=json
Query Parameter
Parameter Name Parameter Type Description
holidayPlanID string --
Request Message
12.5.6.8 Set holiday schedule parameters of card reader authentication mode
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"VerifyHolidayPlanCfg": {
```
/*opt, object, holiday schedule parameters of the card reader authentication mode*/
"enable": true,
/*req, bool, whether to enable, desc:"true"-enable, "false"-disable*/
"beginDate": "1970-01-01",
/*req, date, start date of the holiday, desc:device local time*/
"endDate": "1970-01-02",
/*req, date, end date of the holiday, desc:device local time*/
"HolidayPlanCfg": [
/*req, array, holiday schedule parameters, subType:object*/
```
{
```
"id": 1,
/*req, int, time period No., range:[1,8]*/
"enable": true,
/*req, bool, whether to enable, desc:"true"-enable, "false"-disable*/
"verifyMode": "cardAndPw",
```
/*req, enum, authentication mode, subType:string, desc:"cardAndPw" (card+password), "card" (card), "cardOrPw" (card or password), "fp"
```
```
(fingerprint), "fpAndPw" (fingerprint+password), "fpOrCard" (fingerprint or card), "fpAndCard" (fingerprint+card), "fpAndCardAndPw"
```
```
(fingerprint+card+password), "faceOrFpOrCardOrPw" (face or fingerprint or card or password), "faceAndFp" (face+fingerprint), "faceAndPw" (face+password),
```
```
"faceAndCard" (face+card), "face" (face), "employeeNoAndPw" (employee No.+password), "fpOrPw" (fingerprint or password), "employeeNoAndFp" (employee
```
```
No.+fingerprint), "employeeNoAndFpAndPw" (employee No.+fingerprint+password), "faceAndFpAndCard" (face+fingerprint+card), "faceAndPwAndFp"
```
```
(face+password+fingerprint), "employeeNoAndFace" (employee No.+face), "faceOrfaceAndCard" (face or face+card), "fpOrface" (fingerprint or face),
```
```
"cardOrfaceOrPw" (card or face or password), "cardOrFace" (card or face), "cardOrFaceOrFp" (card or face or fingerprint), "cardOrFpOrPw" (card or
```
```
fingerprint or password), "iris" (iris), "faceOrFpOrCardOrPwOrIris" (face or fingerprint or card or password or iris), "faceOrCardOrPwOrIris" (face or card
```
```
or password or iris), "cardOrFace" (card or face), "cardOrFaceOrFp" (card or face or password), "faceOrPw" (face or password), "employeeNoAndFaceAndPw"
```
```
(employee No.+face+password), "cardOrFaceOrFaceAndCard" (card or face or face+card), "faceOrFpOrPw" (face or fingerprint or password),
```
```
"cardOrFpOrFaceOrIris" (card or fingerpriont or face or iris), "fpOrFaceOrIrisOrPw" (fingerprint or face or iris or password), "cardOrFpOrIrisOrPw" (card or
```
```
fingerprint or iris or password), "cardOrIrisOrPw" (card or iris or password), "cardAndIris" (card+ris), "fpAndIri" (fingerprint+iris), "faceAndIris"
```
```
(face+iris), "irisAndPw" (iris+password), "cardAndIrisAndPw" (card+iris+password), "faceAndIrisAndPw" (face+iris+password), "cardAndFaceAndIris"
```
```
(card+face+iris)*/
```
```
"TimeSegment": {
```
/*opt, object, time*/
"beginTime": "00:00:00",
/*req, time, start time of the time period, desc:device local time*/
"endTime": "10:00:00"
/*req, time, end time of the time period, desc:device local time*/
```
}
```
```
}
```
]
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded); it is required when an error occurred*/
```
"statusString": "OK",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded); it is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node must be returned when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/VerifyHolidayPlanCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.6.9 Get the holiday schedule configuration capability of the card reader authentication mode
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"VerifyHolidayPlanCfg": {
```
/*ro, opt, object, holiday schedule of card reader authentication mode*/
```
"planNo": {
```
/*ro, opt, object, holiday schedule template No.*/
"@min": 1,
/*ro, opt, int, maximum value*/
"@max": 16
/*ro, opt, int, minimum value*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether to enable, desc:true (enable), false (disable)*/
```
"beginDate": "1970-01-01",
```
/*ro, opt, date, start date of the holiday (device local time), desc:(device local time)*/
```
"endDate": "1970-01-02",
```
/*ro, opt, date, end date of the holiday (device local time), desc:(device local time)*/
```
```
"HolidayPlanCfg": {
```
/*ro, opt, object, holiday schedule parameters*/
"maxSize": 8,
/*ro, opt, int, maximum value*/
```
"id": {
```
/*ro, opt, object, time period No.*/
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 8
/*ro, opt, int, maximum value*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether to enable, desc:true (enable), false (disable)*/
```
```
"verifyMode": {
```
/*ro, opt, object, authentication mode*/
"@opt":
"cardAndPw,card,cardOrPw,fp,fpAndPw,fpOrCard,fpAndCard,fpAndCardAndPw,faceOrFpOrCardOrPw,faceAndFp,faceAndPw,faceAndCard,face,employeeNoAndPw,fpOrPw,employe
eNoAndFp,employeeNoAndFpAndPw,faceAndFpAndCard,faceAndPwAndFp,employeeNoAndFace,faceOrfaceAndCard,fpOrface,cardOrfaceOrPw,cardOrFace,cardOrFaceOrFp,faceOrPw
,employeeNoAndFaceAndPw,cardOrFaceOrFaceAndCard,iris,faceOrFpOrCardOrPwOrIris,faceOrCardOrPwOrIris,sleep,invalid,cardOrFpOrFaceOrIris,fpOrFaceOrIrisOrPw,car
dOrFpOrIrisOrPw,cardOrIrisOrPw,cardAndIris,fpAndIris,faceAndIris,irisAndPw,cardAndIrisAndPw,faceAndIrisAndPw,cardAndFaceAndIris,Pw,cardOrFpOrPw,faceOrFpOrPw
,cardAndVp,faceAndVp,fpAndVp,pwAndVp"
```
/*ro, opt, string, authentication mode, desc:"cardAndPw" (card+password), "card" (card), "cardOrPw" (card or password), "fp" (fingerprint),
```
```
"fpAndPw" (fingerprint+password), "fpOrCard" (fingerprint or card), "fpAndCard" (fingerprint+card), "fpAndCardAndPw" (fingerprint+card+password),
```
```
"faceOrFpOrCardOrPw" (face or fingerprint or card or password), "faceAndFp" (face+fingerprint), "faceAndPw" (face+password), "faceAndCard" (face+card),
```
```
"face" (face), "employeeNoAndPw" (employee No.+password), "fpOrPw" (fingerprint or password), "employeeNoAndFp" (employee No.+fingerprint),
```
```
"employeeNoAndFpAndPw" (employee No.+fingerprint+password), "faceAndFpAndCard" (face+fingerprint+card), "faceAndPwAndFp" (face+password+fingerprint),
```
```
"employeeNoAndFace" (employee No.+face), "faceOrfaceAndCard" (face or face+card), "fpOrface" (fingerprint or face), "cardOrfaceOrPw" (card or face or
```
```
password), "cardOrFace" (card or face), "cardOrFaceOrFp" (card or face or fingerprint), "cardOrFpOrPw" (card or fingerprint or password), "iris" (iris),
```
```
"faceOrFpOrCardOrPwOrIris" (face or fingerprint or card or password or iris), "faceOrCardOrPwOrIris" (face or card or password or iris), "cardOrFace" (card
```
```
or face), "cardOrFaceOrFp" (card or face or password), "faceOrPw" (face or password), "employeeNoAndFaceAndPw" (employee No.+face+password),
```
```
"cardOrFaceOrFaceAndCard" (card or face or face+card), "faceOrFpOrPw" (face or fingerprint or password), "cardOrFpOrFaceOrIris" (card or fingerpriont or
```
```
face or iris), "fpOrFaceOrIrisOrPw" (fingerprint or face or iris or password), "cardOrFpOrIrisOrPw" (card or fingerprint or iris or password),
```
```
"cardOrIrisOrPw" (card or iris or password), "cardAndIris" (card+ris), "fpAndIri" (fingerprint+iris), "faceAndIris" (face+iris), "irisAndPw"
```
```
(iris+password), "cardAndIrisAndPw" (card+iris+password), "faceAndIrisAndPw" (face+iris+password), "cardAndFaceAndIris" (card+face+iris)*/
```
```
},
```
```
"TimeSegment": {
```
/*ro, opt, object, time*/
"beginTime": "00:00:00",
```
/*ro, opt, time, start time, desc:(device local time)*/
```
"endTime": "10:00:00",
```
/*ro, opt, time, end time, desc:(device local time)*/
```
"validUnit": "minute"
/*ro, opt, enum, time accuracy, subType:string, desc:"hour", "minute", "second". If this node is not returned, the default time accuracy is
"minute"*/
```
}
```
```
},
```
"purePwdVerifyEnable": true
/*ro, opt, bool*/
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/VerifyPlanTemplate/<planTemplateID>?format=json
Query Parameter
Parameter
Name
Parameter
Type Description
planTemplateID string Schedule template No., which starts from 1, and the maximum value supported by thedevice is obtained from the capability set.
Request Message
None
12.5.6.10 Get the schedule template parameters of card reader authentication mode
Hikvision co MMC
adil@hikvision.co.az
Response Message
```
{
```
```
"VerifyPlanTemplate": {
```
/*ro, opt, object, the schedule template parameters of card reader authentication mode*/
"enable": true,
/*ro, req, bool, whether to enable, desc:"true"-enable, "false"-disable*/
"templateName": "test",
/*ro, req, string, template name*/
"weekPlanNo": 1,
/*ro, req, int, week schedule No.*/
"holidayGroupNo": "1,3,5"
/*ro, req, string, holiday group No., desc:holiday group No.*/
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/VerifyPlanTemplate/<planTemplateID>?format=json
Query Parameter
Parameter
Name
Parameter
Type Description
planTemplateID string Schedule template No., which starts from 1, and the maximum value supported by thedevice is obtained from the capability set.
Request Message
```
{
```
```
"VerifyPlanTemplate": {
```
/*opt, object*/
"enable": true,
```
/*req, bool, whether to enable, desc:true (yes), false (no)*/
```
"templateName": "test",
/*req, string, template name*/
"weekPlanNo": 1,
/*req, int, week schedule No.*/
"holidayGroupNo": "1,3,5"
/*req, string, holiday group No., desc:holiday group No.*/
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "OK",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:it is required when the value of statusCode is not 1, and it corresponds to subStatusCode*/
"errorMsg": "ok",
/*ro, opt, string, error information, desc:this field is required when the value of statusCode is not 1*/
"MErrCode": "0x00000000",
/*ro, opt, string*/
"MErrDevSelfEx": "0x00000000"
/*ro, opt, string*/
```
}
```
Request URL
GET /ISAPI/AccessControl/VerifyPlanTemplate/capabilities?format=json
Query Parameter
None
Request Message
12.5.6.11 Set the schedule template parameters of the card reader authentication mode
12.5.6.12 Get the schedule template configuration capability of the card reader authentication mode
Hikvision co MMC
adil@hikvision.co.az
None
Response Message
```
{
```
```
"VerifyPlanTemplate": {
```
/*ro, opt, object*/
```
"templateNo": {
```
/*ro, opt, object, schedule template No.*/
"@min": 1,
/*ro, opt, int*/
"@max": 16
/*ro, opt, int*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether to enable, desc:true (yes), false (no)*/
```
```
"templateName": {
```
/*ro, opt, object, template name length*/
"@min": 1,
/*ro, opt, int*/
"@max": 32
/*ro, opt, int*/
```
},
```
```
"weekPlanNo": {
```
/*ro, opt, object, weekly schedule No.*/
"@min": 1,
/*ro, opt, int*/
"@max": 16
/*ro, opt, int*/
```
},
```
```
"holidayGroupNo": {
```
/*ro, opt, object, holiday group No.*/
"@min": 1,
/*ro, opt, int*/
"@max": 16
/*ro, opt, int*/
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/VerifyWeekPlanCfg/<weekPlanID>?format=json
Query Parameter
Parameter
Name
Parameter
Type Description
weekPlanID string Weekly schedule No., which starts from 1, and the maximum value supported by thedevice is obtained from the capability set.
Request Message
None
Response Message
12.5.6.13 Get the week schedule configuration parameters of the card reader authentication mode
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"VerifyWeekPlanCfg": {
```
/*ro, opt, object, the week schedule configuration parameters of the card reader authentication mode*/
"enable": true,
```
/*ro, req, bool, whether to enable the week schedule configuration parameters of the card reader authentication mode, desc:true (enable), false
```
```
(disable)*/
```
"WeekPlanCfg": [
/*ro, req, array, week schedule parameters, subType:object*/
```
{
```
"week": "Monday",
/*ro, req, enum, day of a week, subType:string, desc:"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"*/
"id": 1,
/*ro, req, int, time period No., range:[1,8]*/
"enable": true,
/*ro, req, bool, whether to enable week schedule*/
"verifyMode": "cardAndPw",
```
/*ro, req, enum, authentication mode, subType:string, desc:"cardAndPw" (card+password), "card" (card), "cardOrPw" (card or password), "fp"
```
```
(fingerprint), "fpAndPw" (fingerprint+password), "fpOrCard" (fingerprint or card), "fpAndCard" (fingerprint+card), "fpAndCardAndPw"
```
```
(fingerprint+card+password), "faceOrFpOrCardOrPw" (face or fingerprint or card or password), "faceAndFp" (face+fingerprint), "faceAndPw" (face+password),
```
```
"faceAndCard" (face+card), "face" (face), "employeeNoAndPw" (employee No.+password), "fpOrPw" (fingerprint or password), "employeeNoAndFp" (employee
```
```
No.+fingerprint), "employeeNoAndFpAndPw" (employee No.+fingerprint+password), "faceAndFpAndCard" (face+fingerprint+card), "faceAndPwAndFp"
```
```
(face+password+fingerprint), "employeeNoAndFace" (employee No.+face), "faceOrfaceAndCard" (face or face+card), "fpOrface" (fingerprint or face),
```
```
"cardOrfaceOrPw" (card or face or password), "cardOrFace" (card or face), "cardOrFaceOrFp" (card or face or fingerprint), "cardOrFpOrPw" (card or
```
```
fingerprint or password), "iris" (iris), "faceOrFpOrCardOrPwOrIris" (face or fingerprint or card or password or iris), "faceOrCardOrPwOrIris" (face or card
```
```
or password or iris), "cardOrFace" (card or face), "cardOrFaceOrFp" (card or face or password), "faceOrPw" (face or password), "employeeNoAndFaceAndPw"
```
```
(employee No.+face+password), "cardOrFaceOrFaceAndCard" (card or face or face+card), "faceOrFpOrPw" (face or fingerprint or password),
```
```
"cardOrFpOrFaceOrIris" (card or fingerpriont or face or iris), "fpOrFaceOrIrisOrPw" (fingerprint or face or iris or password), "cardOrFpOrIrisOrPw" (card or
```
```
fingerprint or iris or password), "cardOrIrisOrPw" (card or iris or password), "cardAndIris" (card+ris), "fpAndIri" (fingerprint+iris), "faceAndIris"
```
```
(face+iris), "irisAndPw" (iris+password), "cardAndIrisAndPw" (card+iris+password), "faceAndIrisAndPw" (face+iris+password), "cardAndFaceAndIris"
```
```
(card+face+iris)*/
```
```
"TimeSegment": {
```
/*ro, req, object, time*/
"beginTime": "00:00:00",
/*ro, req, time, start time, desc:device local time*/
"endTime": "10:00:00"
/*ro, req, time, end time, desc:device local time*/
```
}
```
```
}
```
]
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/VerifyWeekPlanCfg/<weekPlanID>?format=json
Query Parameter
Parameter
Name
Parameter
Type Description
weekPlanID string Weekly schedule No., which starts from 1, and the maximum value supported by thedevice is obtained from the capability set.
Request Message
12.5.6.14 Set the week schedule parameters of the card reader authentication mode
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"VerifyWeekPlanCfg": {
```
/*opt, object, the week schedule configuration parameters of the card reader authentication mode*/
"enable": true,
```
/*req, bool, whether to enable, desc:"true" (enable), "false" (disable)*/
```
"WeekPlanCfg": [
/*req, array, week schedule parameters, subType:object*/
```
{
```
"week": "Monday",
/*req, enum, days of the week, subType:string, desc:"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"*/
"id": 1,
/*req, int, time period No., range:[1,8]*/
"enable": true,
/*req, bool, whether to enable week schedule*/
"verifyMode": "cardAndPw",
```
/*req, enum, authentication mode, subType:string, desc:"cardAndPw" (card+password), "card" (card), "cardOrPw" (card or password), "fp"
```
```
(fingerprint), "fpAndPw" (fingerprint+password), "fpOrCard" (fingerprint or card), "fpAndCard" (fingerprint+card), "fpAndCardAndPw"
```
```
(fingerprint+card+password), "faceOrFpOrCardOrPw" (face or fingerprint or card or password), "faceAndFp" (face+fingerprint), "faceAndPw" (face+password),
```
```
"faceAndCard" (face+card), "face" (face), "employeeNoAndPw" (employee No.+password), "fpOrPw" (fingerprint or password), "employeeNoAndFp" (employee
```
```
No.+fingerprint), "employeeNoAndFpAndPw" (employee No.+fingerprint+password), "faceAndFpAndCard" (face+fingerprint+card), "faceAndPwAndFp"
```
```
(face+password+fingerprint), "employeeNoAndFace" (employee No.+face), "faceOrfaceAndCard" (face or face+card), "fpOrface" (fingerprint or face),
```
```
"cardOrfaceOrPw" (card or face or password), "cardOrFace" (card or face), "cardOrFaceOrFp" (card or face or fingerprint), "cardOrFpOrPw" (card or
```
```
fingerprint or password), "iris" (iris), "faceOrFpOrCardOrPwOrIris" (face or fingerprint or card or password or iris), "faceOrCardOrPwOrIris" (face or card
```
```
or password or iris), "cardOrFace" (card or face), "cardOrFaceOrFp" (card or face or password), "faceOrPw" (face or password), "employeeNoAndFaceAndPw"
```
```
(employee No.+face+password), "cardOrFaceOrFaceAndCard" (card or face or face+card), "faceOrFpOrPw" (face or fingerprint or password),
```
```
"cardOrFpOrFaceOrIris" (card or fingerpriont or face or iris), "fpOrFaceOrIrisOrPw" (fingerprint or face or iris or password), "cardOrFpOrIrisOrPw" (card or
```
```
fingerprint or iris or password), "cardOrIrisOrPw" (card or iris or password), "cardAndIris" (card+ris), "fpAndIri" (fingerprint+iris), "faceAndIris"
```
```
(face+iris), "irisAndPw" (iris+password), "cardAndIrisAndPw" (card+iris+password), "faceAndIrisAndPw" (face+iris+password), "cardAndFaceAndIris"
```
```
(card+face+iris)*/
```
```
"TimeSegment": {
```
/*req, object, time*/
"beginTime": "00:00:00",
/*req, time, start time of the time period, desc:device local time*/
"endTime": "10:00:00"
/*req, time, end time of the time period, desc:device local time*/
```
}
```
```
}
```
]
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "OK",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:it is required when the value of statusCode is not 1, and it corresponds to subStatusCode*/
"errorMsg": "ok",
/*ro, opt, string, error information, desc:this field is required when the value of statusCode is not 1*/
"MErrCode": "0x00000000",
/*ro, opt, string*/
"MErrDevSelfEx": "0x00000000"
/*ro, opt, string*/
```
}
```
Request URL
GET /ISAPI/AccessControl/VerifyWeekPlanCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.6.15 Get the weekly schedule configuration capability of the card reader authentication mode
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"VerifyWeekPlanCfg": {
```
/*ro, opt, object, weekly schedule parameters of the card reader authentication mode*/
```
"planNo": {
```
/*ro, opt, object, weekly schedule No.*/
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 16
/*ro, opt, int, maximum value*/
```
},
```
"enable": "true,false",
/*ro, opt, string, whether to enable, desc:"true"-enable, "false"-disable*/
```
"WeekPlanCfg": {
```
/*ro, opt, object, week schedule parameters*/
"maxSize": 56,
/*ro, opt, int, maximum value*/
```
"week": {
```
/*ro, opt, object, day of a week*/
"@opt": "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday"
/*ro, opt, string, day of a week, desc:"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"*/
```
},
```
```
"id": {
```
/*ro, opt, object, weekly schedule No.*/
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 8
/*ro, opt, int, maximum value*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether to enable, desc:true (enable), false (disable)*/
```
```
"verifyMode": {
```
/*ro, opt, object, authentication mode*/
"@opt":
"cardAndPw,card,cardOrPw,fp,fpAndPw,fpOrCard,fpAndCard,fpAndCardAndPw,faceOrFpOrCardOrPw,faceAndFp,faceAndPw,faceAndCard,face,employeeNoAndPw,fpOrPw,employe
eNoAndFp,employeeNoAndFpAndPw,faceAndFpAndCard,faceAndPwAndFp,employeeNoAndFace,faceOrfaceAndCard,fpOrface,cardOrfaceOrPw,cardOrFace,cardOrFaceOrFp,faceOrPw
,employeeNoAndFaceAndPw,cardOrFaceOrFaceAndCard,iris,faceOrFpOrCardOrPwOrIris,faceOrCardOrPwOrIris,sleep,invalid,cardOrFpOrFaceOrIris,fpOrFaceOrIrisOrPw,car
dOrFpOrIrisOrPw,cardOrIrisOrPw,cardAndIris,fpAndIris,faceAndIris,irisAndPw,cardAndIrisAndPw,faceAndIrisAndPw,cardAndFaceAndIris,Pw,cardOrFpOrPw,faceOrFpOrPw
,cardAndVp,faceAndVp,fpAndVp,pwAndVp"
```
/*ro, opt, string, authentication mode, desc:"cardAndPw" (card+password), "card" (card), "cardOrPw" (card or password), "fp" (fingerprint),
```
```
"fpAndPw" (fingerprint+password), "fpOrCard" (fingerprint or card), "fpAndCard" (fingerprint+card), "fpAndCardAndPw" (fingerprint+card+password),
```
```
"faceOrFpOrCardOrPw" (face or fingerprint or card or password), "faceAndFp" (face+fingerprint), "faceAndPw" (face+password), "faceAndCard" (face+card),
```
```
"face" (face), "employeeNoAndPw" (employee No.+password), "fpOrPw" (fingerprint or password), "employeeNoAndFp" (employee No.+fingerprint),
```
```
"employeeNoAndFpAndPw" (employee No.+fingerprint+password), "faceAndFpAndCard" (face+fingerprint+card), "faceAndPwAndFp" (face+password+fingerprint),
```
```
"employeeNoAndFace" (employee No.+face), "faceOrfaceAndCard" (face or face+card), "fpOrface" (fingerprint or face), "cardOrfaceOrPw" (card or face or
```
```
password), "cardOrFace" (card or face), "cardOrFaceOrFp" (card or face or fingerprint), "cardOrFpOrPw" (card or fingerprint or password), "iris" (iris),
```
```
"faceOrFpOrCardOrPwOrIris" (face or fingerprint or card or password or iris), "faceOrCardOrPwOrIris" (face or card or password or iris), "cardOrFace" (card
```
```
or face), "cardOrFaceOrFp" (card or face or password), "faceOrPw" (face or password), "employeeNoAndFaceAndPw" (employee No.+face+password),
```
```
"cardOrFaceOrFaceAndCard" (card or face or face+card), "faceOrFpOrPw" (face or fingerprint or password), "cardOrFpOrFaceOrIris" (card or fingerpriont or
```
```
face or iris), "fpOrFaceOrIrisOrPw" (fingerprint or face or iris or password), "cardOrFpOrIrisOrPw" (card or fingerprint or iris or password),
```
```
"cardOrIrisOrPw" (card or iris or password), "cardAndIris" (card+ris), "fpAndIri" (fingerprint+iris), "faceAndIris" (face+iris), "irisAndPw"
```
```
(iris+password), "cardAndIrisAndPw" (card+iris+password), "faceAndIrisAndPw" (face+iris+password), "cardAndFaceAndIris" (card+face+iris), "sleep",
```
"invalid"*/
```
},
```
```
"TimeSegment": {
```
/*ro, opt, object, time*/
"beginTime": "00:00:00",
```
/*ro, opt, time, start time, desc:start time of the time period (device local time)*/
```
"endTime": "10:00:00",
```
/*ro, opt, time, end time, desc:end time of the time period (device local time)*/
```
"validUnit": "minute"
/*ro, opt, enum, time accuracy, subType:string, desc:If this node is not returned, it indicates that the time accuracy is "minute". "hour",
"minute", "second"*/
```
}
```
```
},
```
"purePwdVerifyEnable": true
/*ro, opt, bool*/
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/CardReaderCfg/<cardReaderID>?format=json
Query Parameter
Parameter Name Parameter Type Description
cardReaderID string --
Request Message
12.5.7 Credential Recognition Module Management
12.5.7.1 Set the card reader parameters
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"CardReaderCfg": {
```
/*req, object, card reader information*/
"enable": true,
/*req, bool, whether to enable, desc:true-yes, false-no*/
"okLedPolarity": "cathode",
/*opt, enum, OK LED polarity, subType:string, desc:"cathode", "anode”*/
"errorLedPolarity": "cathode",
/*opt, enum, Error LED polarity, subType:string, desc:"cathode", "anode"*/
"buzzerPolarity": "cathode",
/*opt, enum, buzzer polarity, subType:string, desc:"cathode", "anode"*/
"swipeInterval": 1,
/*opt, int, time interval of repeated authentication, unit:s, desc:it is valid for authentication modes such as fingerprint, card, face, etc.*/
"pressTimeout": 1,
/*opt, int, timeout to reset entry on keypad, unit:s*/
"enableFailAlarm": true,
/*opt, bool, whether to enable excessive failed authentication attempt alarm*/
"maxReadCardFailNum": 1,
/*opt, int, maximum number of failed authentication attempts*/
"enableTamperCheck": true,
/*opt, bool, whether to enable tampering detection*/
"offlineCheckTime": 1,
/*opt, int, time to detect after the card reader is offline, unit:s*/
"fingerPrintCheckLevel": 1,
```
/*opt, enum, fingerprint recognition level, subType:int, desc:1-1/10 false acceptance rate (FAR), 2-1/100 false acceptance rate (FAR), 3-1/1000
```
```
false acceptance rate (FAR), 4-1/10000 false acceptance rate (FAR), 5-1/100000 false acceptance rate (FAR), 6-1/1000000 false acceptance rate (FAR), 7-
```
```
1/10000000 false acceptance rate (FAR), 8-1/100000000 false acceptance rate (FAR), 9-3/100 false acceptance rate (FAR), 10-3/1000 false acceptance rate
```
```
(FAR), 11-3/10000 false acceptance rate (FAR), 12-3/100000 false acceptance rate (FAR), 13-3/1000000 false acceptance rate (FAR), 14-3/10000000 false
```
```
acceptance rate (FAR), 15-3/100000000 false acceptance rate (FAR), 16-Automatic Normal, 17-Automatic Secure, 18-Automatic More Secure (currently not
```
```
support)*/
```
"useLocalController": true,
/*opt, bool, whether it is connected to the distributed controller*/
"localControllerID": 1,
```
/*opt, int, distributed controller No., range:[0,64], dep:and,{$.CardReaderCfg.localControllerID,eq,true}, desc:0-unregistered. This field is valid
```
only when useLocalController is "true"*/
"localControllerReaderID": 1,
```
/*opt, int, card reader ID of the distributed controller, dep:and,{$.CardReaderCfg.localControllerID,eq,true}, desc:0-unregistered. This field is
```
valid only when useLocalController is "true"*/
"cardReaderChannel": 1,
```
/*opt, enum, communication channel No. of the card reader, subType:int, dep:and,{$.CardReaderCfg.localControllerID,eq,true}, desc:0-Wiegand or
```
offline, 1-RS-485A, 2-RS-485B. This field is valid only when useLocalController is "true"*/
"fingerPrintImageQuality": 1,
```
/*opt, enum, fingerprint image quality, subType:int, desc:1-low quality (V1), 2-medium quality (V1), 3-high quality (V1), 4-highest quality (V1), 5-
```
```
low quality (V2), 6-medium quality (V2), 7-high quality (V2), 8-highest quality (V2)*/
```
"fingerPrintContrastTimeOut": 1,
/*opt, enum, fingerprint comparison timeout, subType:int, desc:it is between 1 and 20, unit: second, 255-infinite*/
"fingerPrintRecogizeInterval": 1,
/*opt, enum, fingerprint scanning interval, subType:int, desc:it is between 1 and 10, unit: second, 255-no delay*/
"fingerPrintMatchFastMode": 1,
/*opt, enum, fingerprint matching quick mode, subType:int, desc:1-quick mode 1, 2-quick mode 2, 3-quick mode 3, 4-quick mode 4, 5-quick mode 5, 255-
automatic*/
"fingerPrintModuleSensitive": 1,
/*opt, enum, fingerprint module sensitivity, subType:int, desc:fingerprint module sensitivity,which is between 1 and 8*/
"fingerPrintModuleLightCondition": "outdoor",
/*opt, enum, fingerprint module light condition, subType:string, desc:"outdoor", "indoor”*/
"faceMatchThresholdN": 1,
/*opt, int, threshold of face picture 1:N comparison, range:[0,100], desc:threshold of face picture 1:N comparison,which is between 0 and 100*/
"faceQuality": 1,
/*opt, int, face picture quality, range:[0,100]*/
"faceRecogizeTimeOut": 1,
/*opt, enum, face recognition timeout, subType:int, desc:it is between 1 and 20, unit: second, 255-infinite*/
"faceRecogizeInterval": 1,
/*opt, enum, face recognition interval, subType:int, desc:it is between 1 and 10, unit: second, 255-no delay*/
"cardReaderFunction": ["fingerPrint", "face", "fingerVein", "iris", "card"],
/*opt, enumarray, card reader type, subType:string, desc:"fingerPrint"-fingerprint, "face", "fingerVein"-finger vein, “iris”. For example,
["fingerPrint","face"] indicates that the card reader supports both fingerprint and face*/
"cardReaderDescription": "Wiegand\u000485Offline",
/*opt, string, card reader description, desc:if the card reader is the Wiegand card reader or if offline, this field will be set to "Wiegand" or
"485Offline”*/
"faceImageSensitometry": 1,
/*opt, int, face picture exposure, range:[0,655535]*/
"livingBodyDetect": true,
/*opt, bool, whether to enable human detection*/
"faceMatchThreshold1": 1,
/*opt, int, threshold of face picture 1:1 comparison, range:[0,100], desc:threshold of face picture 1:1 comparison,which is between 0 and 100*/
"buzzerTime": 1,
/*opt, int, buzzing duration, range:[0,59999], unit:s, desc:0-long buzzing*/
"faceMatch1SecurityLevel": 1,
/*opt, enum, security level of face 1:1 recognition, subType:int, desc:1-normal, 2-high, 3-higher*/
"faceMatchNSecurityLevel": 1,
/*opt, enum, security level of face 1:N recognition, subType:int, desc:1-normal, 2-high, 3-higher*/
"envirMode": "indoor",
/*opt, enum, environment mode of face recognition, subType:string, desc:"indoor", "other”*/
"liveDetLevelSet": "low",
/*opt, enum, threshold level of liveness detection, subType:string, desc:"low", "middle"-medium, "high"*/
"liveDetThreshold": 1,
/*opt, int, range:[0,100]*/
"liveDetAntiAttackCntLimit": 1,
/*opt, int, number of anti-attacks of liveness detection,, range:[1,255], desc:this value should be configured as the same one on both client and
device*/
"enableLiveDetAntiAttack": true,
/*opt, bool, whether to enable anti-attack for liveness detection*/
"liveDetAntiAttackLockedTime": 1,
Hikvision co MMC
adil@hikvision.co.az
/*opt, int, range:[0,300], unit:s*/
"supportDelFPByID": true,
/*opt, bool, whether the card reader supports deleting fingerprint by fingerprint ID, desc:true-yes, false-no*/
"fingerPrintCapacity": 1,
/*opt, int, fingerprint capacity*/
"fingerPrintNum": 1,
/*opt, int, number of added fingerprints*/
"defaultVerifyMode": "cardAndPw",
```
/*opt, enum, default authentication mode of the fingerprint and card reader (factory defaults):, subType:string, desc:factory defaults; "cardAndPw"
```
```
(card+password), "card" (card), "cardOrPw" (card or password), "fp" (fingerprint), "fpAndPw" (fingerprint+password), "fpOrCard" (fingerprint or card),
```
```
"fpAndCard" (fingerprint+card), "fpAndCardAndPw" (fingerprint+card+password), "faceOrFpOrCardOrPw" (face or fingerprint or card or password), "faceAndFp"
```
```
(face+fingerprint), "faceAndPw" (face+password), "faceAndCard" (face+card), "face" (face), "employeeNoAndPw" (employee No.+password), "fpOrPw" (fingerprint
```
```
or password), "employeeNoAndFp" (employee No.+fingerprint), "employeeNoAndFpAndPw" (employee No.+fingerprint+password), "faceAndFpAndCard"
```
```
(face+fingerprint+card), "faceAndPwAndFp" (face+password+fingerprint), "employeeNoAndFace" (employee No.+face), "faceOrfaceAndCard" (face or face+card),
```
```
"fpOrface" (fingerprint or face), "cardOrfaceOrPw" (card or face or password), "cardOrFace" (card or face), "cardOrFaceOrFp" (card or face or fingerprint),
```
```
"cardOrFpOrPw" (card or fingerprint or password), "iris" (iris), "faceOrFpOrCardOrPwOrIris" (face or fingerprint or card or password or iris),
```
```
"faceOrCardOrPwOrIris" (face or card or password or iris), "cardOrFace" (card or face), "cardOrFaceOrFp" (card or face or password), "faceOrPw" (face or
```
```
password), "employeeNoAndFaceAndPw" (employee No.+face+password), "cardOrFaceOrFaceAndCard" (card or face or face+card), "faceOrFpOrPw" (face or fingerprint
```
```
or password), "cardOrFpOrFaceOrIris" (card or fingerpriont or face or iris), "fpOrFaceOrIrisOrPw" (fingerprint or face or iris or password),
```
```
"cardOrFpOrIrisOrPw" (card or fingerprint or iris or password), "cardOrIrisOrPw" (card or iris or password), "cardAndIris" (card+ris), "fpAndIri"
```
```
(fingerprint+iris), "faceAndIris" (face+iris), "irisAndPw" (iris+password), "cardAndIrisAndPw" (card+iris+password), "faceAndIrisAndPw"
```
```
(face+iris+password), "cardAndFaceAndIris" (card+face+iris)*/
```
"faceRecogizeEnable": 1,
/*opt, enum, whether to enable facial recognition, subType:int, desc:1-enable, 2-disable, 3-attendence checked in/out by recognition of multiple
faces*/
"FPAlgorithmVersion": "test",
/*opt, string, fingerprint algorithm library version, range:[1,32]*/
"cardReaderVersion": "test",
/*opt, string, card reader version, range:[1,32]*/
"enableReverseCardNo": true,
/*opt, bool, whether to enable reversing the card No.*/
"independSwipeIntervals": 0,
/*opt, int, time interval of person authentication, unit: second. This time interval is calculated for each person separately and is different from
swipeInterval, desc:time interval of person authentication,unit: second. This time interval is calculated for each person separately and is different from
swipeInterval*/
"maskFaceMatchThresholdN": 1,
```
/*opt, int, 1:N face picture (face with mask and normal background) comparison threshold, range:[0,100], desc:1:N face picture (face with mask and
```
```
normal background) comparison threshold,value range: [0,100]*/
```
"maskFaceMatchThreshold1": 1,
```
/*opt, int, 1:1 face picture (face with mask and normal background) comparison threshold, range:[0,100], desc:1:1 face picture (face with mask and
```
```
normal background) comparison threshold,value range: [0,100]*/
```
"faceMotionDetLevel": "low",
/*opt, enum, face motion detection level, subType:string, desc:"high", "medium", "low"*/
"showMode": "normal",
```
/*opt, enum, display mode, subType:string, desc:this node is not valid; simple mode indicates that the device displays authentication results
```
```
exclude employee No., name, etc.; the device applies normal mode by default; advertisement mode indicates that the device displays both advertisement and
```
```
authentication results; meeting mode indicates that the device displays check-in page of the conference; custom mode indicates that the device displays
```
```
layout of the interface customized by users; "concise"-simple mode, "normal"-normal mode (default), "advertising"-advertisement mode, "meeting"-meeting
```
mode, "selfDefine"-custom mode*/
"enableScreenOff": true,
/*opt, bool, whether to enable auto locking the screen*/
"screenOffTimeout": 1
/*opt, int, time, step:1, unit:s*/
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "OK",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error description, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/CardReaderCfg/<cardReaderID>?format=json
Query Parameter
Parameter Name Parameter Type Description
cardReaderID string --
Request Message
12.5.7.2 Get the card reader configuration parameters
Hikvision co MMC
adil@hikvision.co.az
None
Response Message
```
{
```
```
"CardReaderCfg": {
```
/*ro, req, object, card reader information*/
"enable": true,
```
/*ro, req, bool, whether to enable, desc:true (enable), false (disable)*/
```
"cardReaderName": "test",
/*ro, opt, string, range:[0,64]*/
"okLedPolarity": "cathode",
/*ro, opt, enum, OK LED polarity, subType:string, desc:"cathode", "anode"*/
"errorLedPolarity": "cathode",
/*ro, opt, enum, Error LED polarity, subType:string, desc:"cathode", "anode"*/
"buzzerPolarity": "cathode",
/*ro, opt, enum, buzzer polarity, subType:string, desc:“cathode", "anode"*/
"swipeInterval": 1,
/*ro, opt, int, time interval of repeated authentication, unit:s, desc:which is valid for authentication modes such as fingerprint, card, face,
etc.*/
"pressTimeout": 1,
/*ro, opt, int, timeout to reset entry on keypad, unit:s*/
"enableFailAlarm": true,
/*ro, opt, bool, whether to enable excessive failed authentication attempts alarm*/
"maxReadCardFailNum": 1,
/*ro, opt, int, maximum number of failed authentication attempts*/
"enableTamperCheck": true,
/*ro, opt, bool, whether to enable tampering detection*/
"offlineCheckTime": 1,
/*ro, opt, int, time to detect after the card reader is offline, unit:s*/
"fingerPrintCheckLevel": 1,
```
/*ro, opt, enum, fingerprint recognition level, subType:int, desc:1-1/10 false acceptance rate (FAR), 2-1/100 false acceptance rate (FAR), 3-1/1000
```
```
false acceptance rate (FAR), 4-1/10000 false acceptance rate (FAR), 5-1/100000 false acceptance rate (FAR), 6-1/1000000 false acceptance rate (FAR), 7-
```
```
1/10000000 false acceptance rate (FAR), 8-1/100000000 false acceptance rate (FAR), 9-3/100 false acceptance rate (FAR), 10-3/1000 false acceptance rate
```
```
(FAR), 11-3/10000 false acceptance rate (FAR), 12-3/100000 false acceptance rate (FAR), 13-3/1000000 false acceptance rate (FAR), 14-3/10000000 false
```
```
acceptance rate (FAR), 15-3/100000000 false acceptance rate (FAR), 16-Automatic Normal, 17-Automatic Secure, 18-Automatic More Secure (currently not
```
```
support)*/
```
"useLocalController": true,
/*ro, opt, bool, whether it is connected to the distributed controller*/
"localControllerID": 1,
```
/*ro, opt, int, distributed controller No., range:[0,64], dep:and,{$.CardReaderCfg.localControllerID,eq,true}, desc:which is between 1 and 64, 0-
```
unregistered. This field is valid only when useLocalController is "true”*/
"localControllerReaderID": 1,
```
/*ro, opt, int, card reader ID of the distributed controller, 0-unregistered, dep:and,{$.CardReaderCfg.localControllerID,eq,true}, desc:this field
```
is valid only when useLocalController is "true”*/
"cardReaderChannel": 1,
```
/*ro, opt, enum, communication channel No. of the card reader, subType:int, dep:and,{$.CardReaderCfg.localControllerID,eq,true}, desc:0-Wiegand or
```
offline, 1-RS-485A, 2-RS-485B. This field is valid only when useLocalController is "true”*/
"fingerPrintImageQuality": 1,
```
/*ro, opt, enum, fingerprint image quality, subType:int, desc:1-low quality (V1), 2-medium quality (V1), 3-high quality (V1), 4-highest quality
```
```
(V1), 5-low quality (V2), 6-medium quality (V2), 7-high quality (V2), 8-highest quality (V2)*/
```
"fingerPrintContrastTimeOut": 1,
/*ro, opt, enum, fingerprint comparison timeout, subType:int, desc:fingerprint comparison timeout,which is between 1 and 20,unit: second,255-
infinite*/
"fingerPrintRecogizeInterval": 1,
/*ro, opt, enum, fingerprint scanning interval, subType:int, desc:fingerprint scanning interval,which is between 1 and 10,unit: second,255-no
delay*/
"fingerPrintMatchFastMode": 1,
/*ro, opt, enum, fingerprint matching quick mode, subType:int, desc:1-quick mode 1, 2-quick mode 2, 3-quick mode 3, 4-quick mode 4, 5-quick mode 5,
255-automatic*/
"fingerPrintModuleSensitive": 1,
/*ro, opt, enum, fingerprint module sensitivity, subType:int, desc:fingerprint module sensitivity,which is between 1 and 8*/
"fingerPrintModuleLightCondition": "outdoor",
/*ro, opt, enum, fingerprint module light condition, subType:string, desc:"outdoor", "indoor”*/
"faceMatchThresholdN": 1,
/*ro, opt, int, threshold of face picture 1:N comparison,which is between 0 and 100, range:[0,100]*/
"faceQuality": 1,
/*ro, opt, int, face picture quality, range:[0,100]*/
"faceRecogizeTimeOut": 1,
/*ro, opt, enum, face recognition timeout, subType:int, desc:face recognition timeout,which is between 1 and 20,unit: second,255-infinite*/
"faceRecogizeInterval": 1,
/*ro, opt, enum, face recognition interval, subType:int, desc:face recognition interval,which is between 1 and 10,unit: second,255-no delay*/
"cardReaderFunction": ["fingerPrint", "face", "card", "voiceprint", "PPAndPV"],
/*ro, opt, enumarray, card reader type, subType:string, desc:"fingerPrint”, "face", "fingerVein". For example, ["fingerPrint", "face"] indicates
that the card reader supports both fingerprint and face*/
"cardReaderDescription": "WiegandOrOffline",
/*ro, opt, string, card reader description, desc:if the card reader is the Wiegand card reader or if offline, this field will be set to "Wiegand" or
"485Offline”*/
"faceImageSensitometry": 1,
/*ro, opt, int, face picture exposure, range:[0,655535]*/
"faceMatchThreshold1": 1,
/*ro, opt, int, threshold of face picture 1:1 comparison, range:[0,100]*/
"buzzerTime": 1,
/*ro, opt, int, buzzing duration, range:[0,59999], unit:s, desc:buzzing duration,which is between 0 and 5999,unit: second,0-long buzzing*/
"faceMatch1SecurityLevel": 1,
```
/*ro, opt, enum, security level of face 1:1 recognition, subType:int, desc:1 (normal), 2 (high), 3 (higher)*/
```
"faceMatchNSecurityLevel": 1,
```
/*ro, opt, enum, security level of face 1:N recognition: 1-normal,2-high,3-higher, subType:int, desc:1 (normal), 2 (high), 3 (higher)*/
```
"envirMode": "other",
/*ro, opt, enum, environment mode of face recognition, subType:string, desc:"indoor", "other”*/
"livingBodyDetect": true,
/*ro, opt, bool, whether to enable human detection*/
Hikvision co MMC
adil@hikvision.co.az
/*ro, opt, bool, whether to enable human detection*/
"liveDetLevelSet": "low",
/*ro, opt, enum, threshold level of liveness detection, subType:string, desc:"low", "middle", "high”*/
"liveDetAntiAttackCntLimit": 1,
/*ro, opt, int, number of anti-attacks of liveness detection, range:[1,255], desc:this value should be configured as the same one on both client and
device*/
"enableLiveDetAntiAttack": true,
/*ro, opt, bool, whether to enable anti-attack for liveness detection*/
"supportDelFPByID": true,
/*ro, opt, bool, whether the card reader supports deleting fingerprint by fingerprint ID, desc:"true"-yes, "false"-no*/
"fingerPrintCapacity": 1,
/*ro, opt, int, fingerprint capacity*/
"fingerPrintNum": 1,
/*ro, opt, int, number of added fingerprints*/
"defaultVerifyMode": "cardAndPw",
```
/*ro, opt, enum, default authentication mode of the fingerprint and card reader (factory defaults), subType:string, desc:factory defaults;
```
```
"cardAndPw" (card+password), "card" (card), "cardOrPw" (card or password), "fp" (fingerprint), "fpAndPw" (fingerprint+password), "fpOrCard" (fingerprint or
```
```
card), "fpAndCard" (fingerprint+card), "fpAndCardAndPw" (fingerprint+card+password), "faceOrFpOrCardOrPw" (face or fingerprint or card or password),
```
```
"faceAndFp" (face+fingerprint), "faceAndPw" (face+password), "faceAndCard" (face+card), "face" (face), "employeeNoAndPw" (employee No.+password), "fpOrPw"
```
```
(fingerprint or password), "employeeNoAndFp" (employee No.+fingerprint), "employeeNoAndFpAndPw" (employee No.+fingerprint+password), "faceAndFpAndCard"
```
```
(face+fingerprint+card), "faceAndPwAndFp" (face+password+fingerprint), "employeeNoAndFace" (employee No.+face), "faceOrfaceAndCard" (face or face+card),
```
```
"fpOrface" (fingerprint or face), "cardOrfaceOrPw" (card or face or password), "cardOrFace" (card or face), "cardOrFaceOrFp" (card or face or fingerprint),
```
```
"cardOrFpOrPw" (card or fingerprint or password), "iris" (iris), "faceOrFpOrCardOrPwOrIris" (face or fingerprint or card or password or iris),
```
```
"faceOrCardOrPwOrIris" (face or card or password or iris), "cardOrFace" (card or face), "cardOrFaceOrFp" (card or face or password), "faceOrPw" (face or
```
```
password), "employeeNoAndFaceAndPw" (employee No.+face+password), "cardOrFaceOrFaceAndCard" (card or face or face+card), "faceOrFpOrPw" (face or fingerprint
```
```
or password), "cardOrFpOrFaceOrIris" (card or fingerpriont or face or iris), "fpOrFaceOrIrisOrPw" (fingerprint or face or iris or password),
```
```
"cardOrFpOrIrisOrPw" (card or fingerprint or iris or password), "cardOrIrisOrPw" (card or iris or password), "cardAndIris" (card+ris), "fpAndIri"
```
```
(fingerprint+iris), "faceAndIris" (face+iris), "irisAndPw" (iris+password), "cardAndIrisAndPw" (card+iris+password), "faceAndIrisAndPw"
```
```
(face+iris+password), "cardAndFaceAndIris" (card+face+iris)*/
```
"faceRecogizeEnable": 1,
```
/*ro, opt, enum, whether to enable facial recognition, subType:int, desc:1 (enable), 2 (disable), 3 (attendence checked in/out by recognition of
```
```
multiple faces)*/
```
"FPAlgorithmVersion": "test",
/*ro, opt, string, fingerprint algorithm library version, range:[1,32]*/
"cardReaderVersion": "test",
/*ro, opt, string, card reader version, range:[1,32]*/
"enableReverseCardNo": true,
/*ro, opt, bool, whether to enable reversing the card No.*/
"independSwipeIntervals": 0,
/*ro, opt, int, time interval of person authentication, desc:unit: second. This time interval is calculated for each person separately and is
different from swipeInterval*/
"maskFaceMatchThresholdN": 1,
```
/*ro, opt, int, 1:N face picture (face with mask and normal background) comparison threshold, range:[0,100]*/
```
"maskFaceMatchThreshold1": 1,
```
/*ro, opt, int, 1:1 face picture (face with mask and normal background) comparison threshold, range:[0,100]*/
```
"faceMotionDetLevel": "low",
/*ro, opt, enum, face motion detection level, subType:string, desc:"high", "medium", "low"*/
"showMode": "normal",
```
/*ro, opt, enum, display mode, subType:string, desc:this node is not valid; simple mode indicates that the device displays authentication results
```
```
exclude employee No., name, etc.; the device applies normal mode by default; advertisement mode indicates that the device displays both advertisement and
```
```
authentication results; meeting mode indicates that the device displays check-in page of the conference; custom mode indicates that the device displays
```
```
layout of the interface customized by users; "concise"-simple mode, "normal"-normal mode (default), "advertising"-advertisement mode, "meeting"-meeting
```
mode, "selfDefine"-custom mode*/
"enableScreenOff": true,
/*ro, opt, bool, whether to enable auto locking the screen*/
"screenOffTimeout": 1,
/*ro, opt, int, time, step:1, unit:s*/
"QRCodeEnabled": false,
/*ro, opt, bool*/
"swipeCardEnabled": true,
/*ro, opt, bool*/
"pressEnabled": true,
/*ro, opt, bool*/
"buzzerEnabled": true,
/*ro, opt, bool*/
"elevatorCarID": 1
/*ro, opt, int, range:[1,8]*/
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/CardReaderCfg/capabilities?format=json&cardReaderID=<cardReaderID>
Query Parameter
Parameter Name Parameter Type Description
cardReaderID string --
Request Message
None
Response Message
12.5.7.3 Get the configuration capability of the card reader
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"CardReaderCfg": {
```
/*ro, req, object, Set Card Reader Parameters*/
```
"cardReaderNo": {
```
/*ro, opt, object, card reader No., desc:card reader No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 512,
/*ro, opt, int, the maximum value*/
```
},
```
"enable": "true,false",
/*ro, opt, string, whether to enable, desc:"true"-yes,"false"-no*/
```
"okLedPolarity": {
```
/*ro, opt, object, OK LED polarity*/
"@opt": "cathode,anode"
/*ro, req, string, options, desc:"cathode", "anode"*/
```
},
```
```
"errorLedPolarity": {
```
/*ro, opt, object, error LED polarity*/
"@opt": "cathode,anode"
/*ro, req, string, options, desc:"cathode", "anode"*/
```
},
```
```
"swipeInterval": {
```
/*ro, opt, object, time interval of repeated authentication, desc:it is valid for authentication modes such as fingerprint, card, face, etc., unit:
second*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 255
/*ro, req, int, the maximum value*/
```
},
```
```
"pressTimeout": {
```
/*ro, opt, object, timeout to reset entry on keypad, desc:unit: second*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 255
/*ro, req, int, the maximum value*/
```
},
```
"enableFailAlarm": "true,false",
/*ro, opt, string, whether to enable excessive failed authentication attempts alarm*/
```
"maxReadCardFailNum": {
```
/*ro, opt, object, maximum number of failed authentication attempts*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 255
/*ro, req, int, the maximum value*/
```
},
```
"enableTamperCheck": "true,false",
/*ro, opt, string, whether to enable tampering detection*/
```
"offlineCheckTime": {
```
/*ro, opt, object, time to detect after the card reader is offline, desc:unit: second*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 255
/*ro, req, int, the maximum value*/
```
},
```
```
"fingerPrintCheckLevel": {
```
/*ro, opt, object, fingerprint recognition level*/
"@opt": "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18"
/*ro, req, string, options*/
```
},
```
```
"faceMatchThresholdN": {
```
/*ro, opt, object, threshold of face picture 1:N comparison, desc:it is between 0 and 100*/
"@min": 0,
/*ro, req, int, the minimum value*/
"@max": 100
/*ro, req, int, the maximum value*/
```
},
```
```
"faceRecogizeTimeOut": {
```
```
/*ro, opt, object, face recognition timeout, desc:it is between 1 and 20, unit: second, 0 (infinite)*/
```
"@min": 0,
/*ro, req, int, the minimum value*/
"@max": 20
/*ro, req, int, the maximum value*/
```
},
```
```
"faceRecogizeInterval": {
```
```
/*ro, opt, object, face recognition interval, desc:it is between 1 and 10, unit: second, 0 (no delay)*/
```
"@min": 0,
/*ro, req, int, the minimum value*/
"@max": 10
/*ro, req, int, the maximum value*/
```
},
```
```
"cardReaderFunction": {
```
/*ro, opt, object, card reader type*/
"@opt": "fingerPrint,face,fingerVein,iris,card,voiceprint,PPAndPV"
```
/*ro, req, string, options, desc:"fingerPrint” (fingerprint), "face", "fingerVein” (finger vein), “iris”*/
```
```
},
```
```
"cardReaderDescription": {
```
/*ro, opt, object, card reader description, desc:if the card reader is the Wiegand card reader or if offline, this field will be set to "Wiegand" or
"485Offline"*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 16
/*ro, req, int, the maximum value*/
Hikvision co MMC
adil@hikvision.co.az
/*ro, req, int, the maximum value*/
```
},
```
```
"faceMatchThreshold1": {
```
/*ro, opt, object, threshold of face picture 1:1 comparison, desc:it is between 0 and 100*/
"@min": 0,
/*ro, req, int, the minimum value*/
"@max": 100
/*ro, req, int, the maximum value*/
```
},
```
"livingBodyDetect": "true,false",
/*ro, opt, string, whether to enable human detection*/
```
"liveDetLevelSet": {
```
/*ro, opt, object, threshold level of liveness detection*/
"@opt": "low,middle,high,general,enhancive,professional"
/*ro, req, string, options*/
```
},
```
```
"liveDetAntiAttackCntLimit": {
```
/*ro, opt, object, number of anti-attacks of liveness detection, desc:it is between 1 and 255. This value should be configured as the same one on
both client and device*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 255
/*ro, req, int, the maximum value*/
```
},
```
"enableLiveDetAntiAttack": "true,false",
/*ro, opt, string, whether to enable anti-attack for liveness detection, desc:whether to enable anti-attack for liveness detection*/
```
"fingerPrintCapacity": {
```
/*ro, opt, object, maximum number of fingerprints that can be added*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 100
/*ro, req, int, the maximum value*/
```
},
```
```
"fingerPrintNum": {
```
/*ro, opt, object, number of added fingerprints*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 100
/*ro, req, int, the maximum value*/
```
},
```
```
"faceRecogizeEnable": {
```
/*ro, opt, object, whether to enable facial recognition*/
"@opt": "1,2,3"
```
/*ro, req, string, options, desc:1 (enable), 2 (disable), 3 (attendence checked in/out by recognition of multiple faces)*/
```
```
},
```
"enableReverseCardNo": "true,false",
/*ro, opt, string, whether to enable reversing the card No.*/
```
"independSwipeIntervals": {
```
/*ro, opt, object, time interval of person authentication, desc:unit: second. This time interval is calculated for each person separately and is
different from swipeInterval*/
"@min": 1,
/*ro, req, int, the minimum value*/
"@max": 1
/*ro, req, int, the maximum value*/
```
},
```
```
"maskFaceMatchThresholdN": {
```
```
/*ro, opt, object, 1:N face picture (face with mask and normal background) comparison threshold, desc:value range: [0,100]*/
```
"@min": 0,
/*ro, req, int, the minimum value*/
"@max": 100
/*ro, req, int, the maximum value*/
```
},
```
```
"maskFaceMatchThreshold1": {
```
```
/*ro, opt, object, 1:1 face picture (face with mask and normal background) comparison threshold, desc:value range: [0,100]*/
```
"@min": 0,
/*ro, req, int, the minimum value*/
"@max": 100
/*ro, req, int, the maximum value*/
```
},
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/CardVerificationRule/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.7.4 Get the capability of configuring card No. authentication rule
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"CardVerificationRuleCap": {
```
/*ro, req, object*/
```
"cardNoLenMode": {
```
```
/*ro, opt, object, length mode of card No. authentication (comparison), desc:length mode of card No. authentication (comparison)*/
```
"@opt": ["full", "4Bytes", "3Bytes", "wiegand27", "wiegand35", "Corporate1000_35", "Corporate1000_48", "H10302_37", "H10304_37",
"wiegand_26CSN", "H103130_32CSN", "wiegand_56CSN", "wiegand_58"]
/*ro, opt, array, options, subType:string*/
```
},
```
```
"CardVerificationRuleRes": {
```
/*ro, opt, object*/
```
"checkStatus": {
```
```
/*ro, opt, object, status of switching card No. authentication (comparison) mode, desc:"continue" (switching result can be searched for later),
```
```
"ok" (switching completed), "duplicate" (duplicate data exist and switching failed)*/
```
"@opt": ["continue", "ok", "duplicate"]
/*ro, opt, array, options, subType:string*/
```
},
```
```
"progress": {
```
/*ro, opt, object, switching progress in percentage, desc:which is between 0 and 100,and 100 indicates that the card No. authentication
```
(comparison) mode is switched*/
```
"@min": 0,
/*ro, opt, int, the minimum value*/
"@max": 0
/*ro, opt, int, the maximum value*/
```
}
```
```
},
```
```
"reverseCardNoEnabled": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, opt, array, options, subType:bool, range:[1,2]*/
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/CardVerificationRule/progress?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"CardVerificationRuleRes": {
```
/*ro, req, object*/
"checkStatus": "continue",
```
/*ro, opt, enum, status of switching card No. authentication (comparison) mode, subType:string, desc:"continue" (switching result can be searched
```
```
for later), "ok" (switching succeeded), "duplicate" (duplicate data exist and switching failed)*/
```
"progress": 100
```
/*ro, opt, int, switching progress in percentage, range:[0,100], desc:100 indicates that card No. authentication (comparison) mode is switched*/
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/CardVerificationRule?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.7.5 Get the switching progress and configuration result of card No. authentication mode
12.5.7.6 Get the parameters of card No. authentication mode
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"CardVerificationRule": {
```
/*ro, req, object*/
"cardNoLenMode": "full",
```
/*ro, req, enum, length mode of card No. authentication (comparison), subType:string, desc:"full", "3Bytes", "4Bytes". After the card No.
```
```
authentication (comparison) mode is switched, the device should check the card No. compatibility*/
```
"reverseCardNoEnabled": true
/*ro, opt, bool*/
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/CardVerificationRule?format=json
Query Parameter
None
Request Message
```
{
```
```
"CardVerificationRule": {
```
/*req, object*/
"cardNoLenMode": "full",
```
/*req, enum, length mode of card No. authentication (comparison), subType:string, desc:"full", "3Bytes", "4Bytes". After the card No. authentication
```
```
(comparison) mode is switched, the device should check the card No. compatibility*/
```
"reverseCardNoEnabled": true
/*opt, bool*/
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:it is required when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/Configuration/NFCCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"NFCCfgCap": {
```
```
/*ro, opt, object, configuration capability of enabling NFC (Near-Field Communication) function*/
```
"enable": "true,false"
```
/*ro, req, string, whether to enable NFC function, desc:true-yes, false-no (default)*/
```
```
}
```
```
}
```
Request URL
12.5.7.7 Set the parameters of card No. authentication mode
```
12.5.7.8 Get the configuration capability of enabling NFC (Near-Field Communication) function
```
```
12.5.7.9 Get the parameters of enabling NFC (Near-Field Communication) function
```
Hikvision co MMC
adil@hikvision.co.az
GET /ISAPI/AccessControl/Configuration/NFCCfg?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"NFCCfg": {
```
/*ro, req, object*/
"enable": true
```
/*ro, req, bool, whether to enable NFC function, desc:true (yes), false (no). The value of this node is "false" by default*/
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/Configuration/NFCCfg?format=json
Query Parameter
None
Request Message
```
{
```
```
"NFCCfg": {
```
```
/*req, object, configuration capability of enabling NFC (Near-Field Communication) function*/
```
"enable": true
```
/*req, bool, whether to enable NFC function, desc:true-yes, false-no (default)*/
```
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "test",
```
/*ro, opt, string, status description, desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "test",
```
/*ro, opt, string, sub status code, desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, req, int, error code, desc:it is required when the value of statusCode is not 1, and it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, req, string, error information, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/Configuration/RFCardCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
12.5.7.10 Set the parameters of enabling NFC (Near-Field Communication) function
```
```
12.5.7.11 Get the configuration capability of enabling RF (Radio Frequency) card recognition
```
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"RFCardCfgCap": {
```
/*ro, req, object*/
```
"cardType": {
```
/*ro, opt, object, card type, desc:"EMCard"-EM card, "M1Card"-M1 card, "CPUCard"-CPU card, "IDCard"-ID card, "DesfireCard"-DESFire card,
"FelicaCard"-FeliCa card*/
"@opt": ["EMCard", "M1Card", "CPUCard", "IDCard", "FelicaCard"]
/*ro, req, array, options, subType:string*/
```
},
```
```
"enabled": {
```
/*ro, opt, object, whether to enable RF card recognition*/
"@opt": [true, false]
/*ro, req, array, options, subType:bool*/
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/Configuration/RFCardCfg?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
"RFCardCfg": [
/*ro, req, array, subType:object*/
```
{
```
"cardType": "EMCard",
```
/*ro, req, enum, card type, subType:string, desc:"EMCard” (EM card), "M1Card” (M1 card), "CPUCard” (CPU card), "IDCard” (ID card), "DesfireCard”
```
```
(DESFire card), "FelicaCard” (FeliCa card)*/
```
"enabled": true
/*ro, req, bool, whether to enable RF card recognition, desc:true-yes, false-no*/
```
}
```
]
```
}
```
Request URL
PUT /ISAPI/AccessControl/Configuration/RFCardCfg?format=json
Query Parameter
None
Request Message
```
{
```
"RFCardCfg": [
```
/*req, array, the parameters of enabling RF (Radio Frequency) card recognition, subType:object*/
```
```
{
```
"cardType": "EMCard",
```
/*req, enum, card type, subType:string, desc:"EMCard"(EM card), "M1Card"(M1 card), "CPUCard"(CPU card), "IDCard"(ID card), "DesfireCard"(DESFire
```
```
card), "FelicaCard"(FeliCa card)*/
```
"enabled": true
```
/*req, bool, whether to enable RF card recognition, desc:"true"(yes), "false"(no)*/
```
```
}
```
]
```
}
```
Response Message
```
12.5.7.12 Get the parameters of enabling RF (Radio Frequency) card recognition
```
```
12.5.7.13 Set the parameters of enabling RF (Radio Frequency) card recognition
```
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "test",
```
/*ro, opt, string, status description, desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "test",
```
/*ro, opt, string, sub status code, desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, req, int, error code, desc:it is required when the value of statusCode is not 1, and it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, req, string, error information, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
PUT /ISAPI/AccessControl/FaceCompareCond
Query Parameter
None
Request Message
<?xml version="1.0" encoding="UTF-8"?>
<FaceCompareCond xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--req, object, facial recognition parameters, attr:version{opt, string, protocolVersion}-->
```
<faceWidthLowerLimit>
<!--opt, int, face width threshold, range:[0,100], desc:when the detected face width is larger than this threshold, the following conditions will be
ignored and the face picture comparison will be executed it has the highest priority-->50
</faceWidthLowerLimit>
<pitch>
<!--opt, int, face raising or bowing angle, range:[0,90], desc:the smaller the better-->0
</pitch>
<yaw>
<!--opt, int, face siding left or right angle, range:[0,90], desc:the smaller the better-->0
</yaw>
<width>
<!--opt, int, face width, range:[0,100]-->50
</width>
<height>
<!--opt, int, face height, range:[0,100]-->50
</height>
<leftBorder>
<!--opt, int, left border of face, range:[0,100]-->50
</leftBorder>
<rightBorder>
<!--opt, int, right border of face, range:[0,100]-->50
</rightBorder>
<upBorder>
<!--opt, int, top border of face, range:[0,100]-->50
</upBorder>
<bottomBorder>
<!--opt, int, bottom border of face, range:[0,100]-->50
</bottomBorder>
<interorbitalDistance>
<!--opt, int, pupillary distance, range:[0,100]-->50
</interorbitalDistance>
<faceScore>
```
<!--opt, int, face score (face picture quality), range:[0,100], desc:the valid face score must be larger than this value-->50
```
</faceScore>
<maxDistance>
```
<!--opt, enum, maximum recognition distance, subType:string, desc:"0.5" (0.5 m), "1" (1 m), "1.5" (1.5 m), "2" (2m), "auto" (automatic)-->0.5
```
</maxDistance>
<similarity>
<!--opt, float, face picture comparison similarity-->50
</similarity>
<antiFake>
<!--opt, int, face anti- spoofing parameters-->50
</antiFake>
<identifyType>
```
<!--opt, enum, face recognition type, subType:string, desc:highest (the highest similarity, default), single (one picture whose similarity exceeds the
```
```
threshold), multiple (multiple pictures whose similarity exceeds the threshold). If the value of this node is highest, it indicates all face pictures in the
```
whole face picture library will be compared and the one with the highest similarity will be returned. If the value of this node is single, it indicates that
the first picture whose similarity exceeds the threshold will be returned. If the value of this node is multiple, the first 30 pictures whose similarity
exceeds the threshold will be returned-->highest
</identifyType>
<chooseType>
```
<!--opt, enum, face recognition area, subType:string, desc:if "middle" is set, the device will recognize the middle face on the picture; if "biggest" is
```
```
set, the device will recognize the biggest face on the picture; if "all" is set, the device will recognize all faces on the picture; "middle", "biggest",
```
```
"all"; the default value is all-->all
```
</chooseType>
<enabled>
```
<!--opt, enum, whether to enable face recognition, subType:string, desc:singleFace (recognizing a single face, default), close (disable facial
```
12.5.7.14 Set the condition parameters of face picture comparison
Hikvision co MMC
adil@hikvision.co.az
```
<!--opt, enum, whether to enable face recognition, subType:string, desc:singleFace (recognizing a single face, default), close (disable facial
```
```
recognition), multiFace (recognizing multiple faces). This node can be used to enable facial recognition for the device and it will take effect in all
```
readers-->singleFace
</enabled>
<faceScoreEnabled>
<!--opt, bool, whether to enable face scoring, desc:whether to enable face scoring-->true
</faceScoreEnabled>
<ageFaceMatchEnabled>
<!--opt, bool, whether to enable age groups matching-->true
</ageFaceMatchEnabled>
<ageFaceMatchList>
```
<!--opt, array, list of different age groups, subType:object, range:[0,5], dep:or,{$.FaceCompareCond.ageFaceMatchEnabled,eq,true}-->
```
<ageFaceMatch>
<!--opt, object, age groups matching-->
<ageLevel>
```
<!--opt, enum, age groups, subType:int, desc:0 (child who are 0~6 years old), 1 (teenager who are 7~17years old), 2 (youth and prime who are 18~40
```
```
years old), 3 (middle age who are 41~65 years old), 4 (elderly who are more than 66 years old)-->1
```
</ageLevel>
<ageFaceMatchThreshold1>
```
<!--opt, int, matching threshold when authenticating via age groups (1:1), range:[0,100]-->1
```
</ageFaceMatchThreshold1>
<ageFaceMatchThresholdN>
```
<!--opt, int, matching threshold when authenticating via age groups (1:N), range:[0,100]-->1
```
</ageFaceMatchThresholdN>
</ageFaceMatch>
</ageFaceMatchList>
<faceScoreThreshold1>
<!--opt, int, matching threshold when face scoring via 1:N matching mode, range:[0,100], desc:it can rate the captured face pictures and is available
for person and ID comparison and authentication without ID card-->1
</faceScoreThreshold1>
</FaceCompareCond>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, which describes the error in details, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
<description>
<!--ro, opt, string, custom error information description, range:[0,1024], desc:the detailed information of custom error returned by device
applications, which is used for fast debugging-->badXmlFormat
</description>
</ResponseStatus>
Request URL
GET /ISAPI/AccessControl/FaceCompareCond
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<FaceCompareCond xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, facial recognition parameters, attr:version{opt, string, protocolVersion}-->
```
<faceWidthLowerLimit>
<!--ro, opt, int, face width threshold, range:[0,100], desc:when the detected face width is larger than this threshold, the following conditions will be
ignored and the face picture comparison will be executed-->50
</faceWidthLowerLimit>
<pitch>
<!--ro, opt, int, face pitching angle, range:[0,90], desc:the smaller the better-->0
</pitch>
<yaw>
<!--ro, opt, int, face yawing angle, range:[0,90], desc:The smaller, the better.-->0
12.5.7.15 Get the facial recognition parameters.
Hikvision co MMC
adil@hikvision.co.az
<!--ro, opt, int, face yawing angle, range:[0,90], desc:The smaller, the better.-->0
</yaw>
<width>
<!--ro, opt, int, face width, range:[0,100]-->50
</width>
<height>
<!--ro, opt, int, face height, range:[0,100]-->50
</height>
<leftBorder>
<!--ro, opt, int, left border of the face, range:[0,100]-->50
</leftBorder>
<rightBorder>
<!--ro, opt, int, right border of the face, range:[0,100]-->50
</rightBorder>
<upBorder>
<!--ro, opt, int, upper border of the face, range:[0,100]-->50
</upBorder>
<bottomBorder>
<!--ro, opt, int, lower border of the face, range:[0,100]-->50
</bottomBorder>
<interorbitalDistance>
<!--ro, opt, int, pupillary distance, range:[0,100]-->50
</interorbitalDistance>
<faceScore>
<!--ro, opt, int, face score, range:[0,100], desc:the face to be detected is valid when its score is higher than the value of this node-->50
</faceScore>
<maxDistance>
```
<!--ro, opt, enum, maximum recognition distance, subType:string, desc:0.5 (0.5m), 1 (1m), 1.5 (1.5m), 2 (2m), auto (automatic)-->0.5
```
</maxDistance>
<similarity>
<!--ro, opt, float, face picture comparison similarity-->50
</similarity>
<antiFake>
<!--ro, opt, int, face anti-spoofing parameters-->50
</antiFake>
<identifyType>
```
<!--ro, opt, enum, facial recognition type, subType:string, desc:highest (the highest similarity, default), single (one picture whose similarity exceeds
```
```
the threshold), multiple (multiple pictures whose similarity exceeds the threshold). If the value of this node is highest, it indicates all face pictures in
```
the whole face picture library will be compared and the one with the highest similarity will be returned. If the value of this node is single, it indicates
that the first picture whose similarity exceeds the threshold will be returned. If the value of this node is multiple, the first 30 pictures whose
similarity exceeds the threshold will be returned-->highest
</identifyType>
<chooseType>
```
<!--ro, opt, enum, face selection type, subType:string, desc:middle (the face in the middle of the picture), biggest (the biggest face), all (all faces,
```
```
default). If the value of this node is middle, only the face in the middle of a picture will be recognized. If the value of this node is biggest, the
```
biggest face in a picture will be recognized. If the value of this node is all, all faces in a picture will be recognized-->all
</chooseType>
<enabled>
```
<!--ro, opt, enum, whether to enable facial recognition, subType:string, desc:singleFace (recognizing a single face, default), close (disable facial
```
```
recognition), multiFace (recognizing multiple faces). This node can be used to enable facial recognition for the device and it will take effect in all
```
readers-->singleFace
</enabled>
<faceScoreEnabled>
<!--ro, opt, bool, whether to enable face grading, desc:face grading is used to select the high-quality pictures during person and ID comparison or face
picture collection. This field is used together with the faceScore-->true
</faceScoreEnabled>
<ageFaceMatchEnabled>
<!--ro, opt, bool, whether to enable different age groups matching-->true
</ageFaceMatchEnabled>
<ageFaceMatchList>
```
<!--ro, opt, array, list of different age groups, subType:object, range:[0,5], dep:or,{$.FaceCompareCond.ageFaceMatchEnabled,eq,true}-->
```
<ageFaceMatch>
<!--ro, opt, object, age groups matching-->
<ageLevel>
```
<!--ro, opt, enum, age groups, subType:int, desc:0 (child who are 0~6 years old), 1 (teenager who are 7~17years old), 2 (youth and prime who are
```
```
18~40 years old), 3 (middle age who are 41~65 years old), 4 (elderly who are more than 66 years old)-->1
```
</ageLevel>
<ageFaceMatchThreshold1>
```
<!--ro, opt, int, matching threshold when authenticating via age groups (1:1), range:[0,100]-->1
```
</ageFaceMatchThreshold1>
<ageFaceMatchThresholdN>
```
<!--ro, opt, int, matching threshold when authenticating via age groups (1:N), range:[0,100]-->1
```
</ageFaceMatchThresholdN>
</ageFaceMatch>
</ageFaceMatchList>
<faceScoreThreshold1>
<!--ro, opt, int, matching threshold when face scoring via 1:N matching mode, range:[0,100], desc:it can rate the captured face pictures and is
available for person and ID comparison and authentication without ID card-->1
</faceScoreThreshold1>
</FaceCompareCond>
Request URL
GET /ISAPI/AccessControl/FaceCompareCond/capabilities
Query Parameter
None
12.5.7.16 Get the capability of configuring facial recognition parameters.
Hikvision co MMC
adil@hikvision.co.az
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<FaceCompareCond xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, capability of configuring facial recognition parameters, attr:version{req, string, protocolVersion}-->
```
<faceWidthLowerLimit min="1" max="10">
```
<!--ro, opt, int, face width threshold, range:[0,100], attr:min{req, int},max{req, int}, desc:When the width of the face to be detected exceeds the
```
threshold, the following conditions will be ignored and the face picture comparison will be executed. That is, this parameter has the highest priority.-->1
</faceWidthLowerLimit>
<pitch min="1" max="10">
```
<!--ro, opt, int, face pitching angle, range:[0,90], attr:min{req, int},max{req, int}, desc:The smaller, the better.-->1
```
</pitch>
<yaw min="1" max="10">
```
<!--ro, opt, int, face yawing angle, range:[0,90], attr:min{req, int},max{req, int}, desc:The smaller, the better.-->1
```
</yaw>
<width min="1" max="10">
```
<!--ro, opt, int, face width, range:[0,100], attr:min{req, int},max{req, int}-->1
```
</width>
<height min="1" max="10">
```
<!--ro, opt, int, face height, range:[0,100], attr:min{req, int},max{req, int}-->1
```
</height>
<leftBorder min="1" max="10">
```
<!--ro, opt, int, left border of the face, range:[0,100], attr:min{req, int},max{req, int}-->1
```
</leftBorder>
<rightBorder min="1" max="10">
```
<!--ro, opt, int, right border of the face, range:[0,100], attr:min{req, int},max{req, int}-->1
```
</rightBorder>
<upBorder min="1" max="10">
```
<!--ro, opt, int, upper border of the face, range:[0,100], attr:min{req, int},max{req, int}-->1
```
</upBorder>
<bottomBorder min="1" max="10">
```
<!--ro, opt, int, lower border of the face, range:[0,100], attr:min{req, int},max{req, int}-->1
```
</bottomBorder>
<interorbitalDistance min="1" max="10">
```
<!--ro, opt, int, pupillary distance, range:[0,100], attr:min{req, int},max{req, int}-->1
```
</interorbitalDistance>
<faceScore min="1" max="10">
```
<!--ro, opt, int, face score, range:[0,100], attr:min{req, int},max{req, int}, desc:The face to be detected is valid when its score is higher than the
```
value of this node.-->1
</faceScore>
<maxDistance opt="0.5,0.75,1,1.5,2,auto">
```
<!--ro, opt, string, maximum recognition distance, attr:opt{req, string}, desc:This field takes precedence over interorbitalDistance, unit: m.-->test
```
</maxDistance>
<similarity min="0.0" max="1.0">
```
<!--ro, opt, float, face picture comparison similarity, attr:min{req, int},max{req, int}-->0.000
```
</similarity>
<antiFake min="1" max="10">
```
<!--ro, opt, int, face anti-spoofing parameters, attr:min{req, int},max{req, int}-->1
```
</antiFake>
<identifyType opt="highest,single,multipl">
```
<!--ro, opt, enum, facial recognition type, subType:string, attr:opt{req, string}, desc:highest (the highest similarity, default), single (one picture
```
```
whose similarity exceeds the threshold), multiple (multiple pictures whose similarity exceeds the threshold). If the value of this node is highest, it
```
indicates all face pictures in the whole face picture library will be compared and the one with the highest similarity will be returned. If the value of
this node is single, it indicates that the first picture whose similarity exceeds the threshold will be returned. If the value of this node is multiple, the
first 30 pictures whose similarity exceeds the threshold will be returned.-->highest
</identifyType>
<chooseType opt="middle,biggest,all">
```
<!--ro, opt, enum, face selection type, subType:string, attr:opt{req, string}, desc:middle (the face in the middle of the picture), biggest (the biggest
```
```
face), all (all faces, default). If the value of this node is middle, only the face in the middle of a picture will be recognized. If the value of this node
```
is biggest, the biggest face in a picture will be recognized. If the value of this node is all, all faces in a picture will be recognized.-->middle
</chooseType>
<enabled opt="singleFace,close,multiFace">
```
<!--ro, opt, enum, whether to enable facial recognition, subType:string, attr:opt{req, string}, desc:singleFace (recognizing a single face, default),
```
```
close (disable facial recognition), multiFace (recognizing multiple faces). This node can be used to enable facial recognition for the device and it will
```
take effect in all readers.-->singleFace
</enabled>
<faceScoreEnabled opt="true,false">
```
<!--ro, opt, bool, whether to enable face grading, attr:opt{req, string}, desc:Face grading is used to select the high-quality pictures during person
```
and ID comparison or face picture collection. This field is used together with the faceScore.-->true
</faceScoreEnabled>
<ageFaceMatchEnabled opt="true,false">
```
<!--ro, opt, bool, whether to enable different age groups matching, attr:opt{req, string}-->true
```
</ageFaceMatchEnabled>
<ageFaceMatchList size="5">
```
<!--ro, opt, array, list of different age groups, subType:object, range:[0,5], dep:or,{$.FaceCompareCond.ageFaceMatchEnabled,eq,true}, attr:size{req,
```
```
int}-->
```
<ageFaceMatch>
<!--ro, opt, object, age groups matching-->
<ageLevel opt="0,1,2,3,4">
```
<!--ro, opt, enum, age groups, subType:int, attr:opt{req, string}, desc:0 (child who are 0~6 years old), 1 (teenager who are 7~17years old), 2
```
```
(youth and prime who are 18~40 years old), 3 (middle age who are 41~65 years old), 4 (elderly who are more than 66 years old)-->1
```
</ageLevel>
<ageFaceMatchThreshold1 min="0" max="100">
```
<!--ro, opt, int, matching threshold when authenticating via age groups (1:1), range:[0,100], attr:min{req, int},max{req, int}-->1
```
</ageFaceMatchThreshold1>
<ageFaceMatchThresholdN min="0" max="100">
```
<!--ro, opt, int, matching threshold when authenticating via age groups (1:N), range:[0,100], attr:min{req, int},max{req, int}-->1
```
Hikvision co MMC
adil@hikvision.co.az
```
<!--ro, opt, int, matching threshold when authenticating via age groups (1:N), range:[0,100], attr:min{req, int},max{req, int}-->1
```
</ageFaceMatchThresholdN>
</ageFaceMatch>
</ageFaceMatchList>
<faceScoreThreshold1 min="0" max="100">
```
<!--ro, opt, int, matching threshold when face scoring via 1:N matching mode, range:[0,100], attr:min{req, int},max{req, int}-->1
```
</faceScoreThreshold1>
</FaceCompareCond>
Request URL
GET /ISAPI/AccessControl/FaceRecognizeMode/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"FaceRecognizeMode": {
```
/*ro, opt, object, facial recognition mode*/
```
"mode": {
```
/*ro, req, object, mode*/
"@opt": "normalMode"
```
/*ro, opt, enum, mode options, subType:string, desc:"normalMode" (normal mode), "deepMode" (deep mode)*/
```
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/FaceRecognizeMode?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"FaceRecognizeMode": {
```
/*ro, opt, object, facial recognition mode*/
"mode": "normalMode"
```
/*ro, req, enum, facial recognition mode, subType:string, desc:"normalMode" (normal mode), "deepMode" (deep mode)*/
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/FaceRecognizeMode?format=json
Query Parameter
None
Request Message
12.5.7.17 Get the capability of configuring parameters of the facial recognition mode.
12.5.7.18 Get the parameters of the facial recognition mode.
12.5.7.19 Set the facial recognition mode parameters
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"FaceRecognizeMode": {
```
/*opt, object, facial recognition mode*/
"mode": "normalMode"
```
/*req, enum, facial recognition mode, subType:string, desc:"normalMode" (normal mode), "deepMode" (deep mode)*/
```
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "/ISAPI/Intelligent/FDLib/asyncImportDatas?format=json",
/*ro, opt, string, request URL*/
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:it is required when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/IdentityTerminal
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<IdentityTerminal xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, parameters of face recognition terminal, attr:version{req, string, protocolVersion}-->
```
<terminalMode>
```
<!--ro, opt, enum, terminal mode, subType:string, desc:"authMode” (authentication mode), "registerMode” (registration mode)-->authMode
```
</terminalMode>
<idCardReader>
```
<!--ro, opt, enum, ID card reader model, subType:string, desc:“iDR210”, “DS-K1F110-I”, “DS-K1F1110-B”, “DS-K1F1110-AB”, “none”, “DS-K1F1001-I(USB)”,
```
```
“DS-K1F1002-I(USB)”-->iDR210
```
</idCardReader>
<camera>
<!--ro, opt, enum, camera, subType:string, desc:camera model: C270,DS-2CS5432B-S-->C270
</camera>
<fingerPrintModule>
<!--ro, opt, enum, fingerprint module type, subType:string, desc:“ALIWARD”, “”-->ALIWARD
</fingerPrintModule>
<videoStorageTime>
<!--ro, opt, int, time for saving video, range:[0,10], desc:unit: second-->1
</videoStorageTime>
<faceContrastThreshold>
<!--ro, opt, int, face picture comparison threshold, range:[0,100]-->1
</faceContrastThreshold>
<twoDimensionCode>
<!--ro, opt, enum, whether to enable QR code recognition, subType:string, desc:“enable”, “disable”-->enable
</twoDimensionCode>
<blackListCheck>
<!--ro, opt, enum, whether to enable blocklist verification, subType:string, desc:“enable”, “disable”-->enable
</blackListCheck>
<idCardCheckCenter>
```
<!--ro, opt, enum, ID card comparison mode, subType:string, desc:“local” (compare with ID card of local storage), “server” (compare with ID card of
```
```
remote server storage)-->local
```
</idCardCheckCenter>
<faceAlgorithm>
```
<!--ro, opt, enum, face picture algorithm, subType:string, desc:"DeepLearn" (deep learning algorithm), "Tradition" (third-party algorithm)-->DeepLearn
```
</faceAlgorithm>
<comNo>
<!--ro, opt, int, COM No., range:[1,9]-->1
</comNo>
<memoryLearning>
<!--ro, opt, enum, whether to enable learning and memory function, subType:string, desc:“enable”, “disable”-->enable
</memoryLearning>
<saveCertifiedImage>
<!--ro, opt, enum, whether to enable saving authenticated picture, subType:string, desc:“enable”, “disable”-->enable
</saveCertifiedImage>
12.5.7.20 Get the parameters of face recognition terminal
Hikvision co MMC
adil@hikvision.co.az
</saveCertifiedImage>
<MCUVersion>
<!--ro, opt, string, MCU version information-->test
</MCUVersion>
<usbOutput>
<!--ro, opt, enum, whether to enable USB output of ID card reader, subType:string, desc:“enable”, “disable”-->enable
</usbOutput>
<serialOutput>
<!--ro, opt, enum, whether to enable serial port output of ID card reader, subType:string, desc:“enable”, “disable”-->enable
</serialOutput>
<readInfoOfCard>
```
<!--ro, opt, enum, set content to be read from CPU card, subType:string, desc:“serialNo” (read serial No.), “file” (read file)-->serialNo
```
</readInfoOfCard>
<workMode>
<!--ro, opt, enum, authentication mode, subType:string, desc:“passMode”, “accessControlMode”-->passMode
</workMode>
<ecoMode>
<!--ro, opt, object, ECO mode-->
<eco>
<!--ro, opt, enum, whether to enable ECO mode, subType:string, desc:“enable”, “disable”-->enable
</eco>
<faceMatchThreshold1>
<!--ro, opt, int, 1V1 face picture comparison threshold of ECO mode, range:[0,100]-->1
</faceMatchThreshold1>
<faceMatchThresholdN>
<!--ro, opt, int, 1:N face picture comparison threshold of ECO mode, range:[0,100]-->1
</faceMatchThresholdN>
<changeThreshold>
<!--ro, opt, int, switching threshold of ECO mode, range:[0,8], desc:switching threshold of ECO mode,which is between 0 and 8-->0
</changeThreshold>
<maskFaceMatchThresholdN>
```
<!--ro, opt, int, 1:N face picture (face with mask and normal background picture) comparison threshold of ECO mode, range:[0,100]-->1
```
</maskFaceMatchThresholdN>
<maskFaceMatchThreshold1>
```
<!--ro, opt, int, 1:1 face picture (face with mask and normal background picture) comparison threshold of ECO mode, range:[0,100]-->1
```
</maskFaceMatchThreshold1>
<alwaysInfrared>
<!--ro, opt, bool, whether to enable infrared recognition, desc:if this node exists and changeThreshold is 8, it indicates that the device will not
always enable the infrared recognition-->true
</alwaysInfrared>
<ageFaceMatchList>
<!--ro, opt, array, list of different age groups in ECO mode, subType:object, range:[0,5], desc:list of different age groups in ECO mode-->
<ageFaceMatch>
<!--ro, opt, object, age group matching in ECO mode-->
<ageLevel>
```
<!--ro, opt, enum, age groups, subType:int, desc:0 (child who are 0~6 years old), 1 (teenager who are 7~17years old), 2 (youth and prime who are
```
```
18~40 years old), 3 (middle age who are 41~65 years old), 4 (elderly who are more than 66 years old)-->1
```
</ageLevel>
<ageFaceMatchThreshold1>
```
<!--ro, opt, int, matching threshold when authenticating via age groups in ECO mode (1:1), range:[0,100]-->1
```
</ageFaceMatchThreshold1>
<ageFaceMatchThresholdN>
```
<!--ro, opt, int, matching threshold when authenticating via age groups in ECO mode (1:N), range:[0,100]-->1
```
</ageFaceMatchThresholdN>
</ageFaceMatch>
</ageFaceMatchList>
</ecoMode>
<readCardRule>
<!--ro, opt, enum, card No. setting rule, subType:string, desc:"wiegand26", "wiegand34”-->wiegand26
</readCardRule>
<enableScreenOff>
<!--ro, opt, bool, whether the device enters the sleep mode when there is no operation after the configured sleep time-->true
</enableScreenOff>
<screenOffTimeout>
```
<!--ro, opt, int, sleep time, range:[0,3600], unit:s, dep:or,{$.IdentityTerminal.enableScreenOff,eq,true}, desc:unit: second-->1
```
</screenOffTimeout>
<enableScreensaver>
<!--ro, opt, bool, whether to enable the screen saver function-->true
</enableScreensaver>
<faceModuleVersion>
<!--ro, opt, string, face recognition module version, range:[1,32]-->test
</faceModuleVersion>
<showMode>
```
<!--ro, opt, enum, display mode, subType:string, desc:"concise" (simple mode,only the authentication result will be displayed), "normal" (normal mode).
```
The default mode is normal mode. If this node does not exist, the default mode is normal mode-->concise
</showMode>
<popUpPreviewWindow>
```
<!--ro, opt, bool, whether to pop up live view window, dep:or,{$.IdentityTerminal.showMode,eq,advertising}-->true
```
</popUpPreviewWindow>
<needDeviceCheck>
```
<!--ro, opt, bool, whether it need device check in permission free mode, dep:or,{$.IdentityTerminal.workMode,eq,passMode}-->true
```
</needDeviceCheck>
<previewShowTime>
```
<!--ro, opt, int, display duration in live view, range:[1,99], unit:s, dep:or,{$.IdentityTerminal.popUpPreviewWindow,eq,true}-->1
```
</previewShowTime>
<screensaverTimeout>
```
<!--ro, opt, int, range:[0,3600], unit:s, dep:or,{$.IdentityTerminal.enableScreensaver,eq,true}-->1
```
</screensaverTimeout>
<screensaverDuration>
```
<!--ro, opt, int, range:[0,3600], unit:s, dep:or,{$.IdentityTerminal.enableScreensaver,eq,true}-->1
```
</screensaverDuration>
<standbyTimeout>
<!--ro, opt, int, range:[30,1800], unit:s-->30
</standbyTimeout>
Hikvision co MMC
adil@hikvision.co.az
</standbyTimeout>
<advertisingDisplayType>
```
<!--ro, opt, enum, subType:string, dep:or,{$.IdentityTerminal.showMode,eq,advertising}-->full
```
</advertisingDisplayType>
</IdentityTerminal>
Request URL
PUT /ISAPI/AccessControl/IdentityTerminal
Query Parameter
None
Request Message
<?xml version="1.0" encoding="UTF-8"?>
<IdentityTerminal xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--req, object, the parameters of face recognition terminal, attr:version{req, string, protocolVersion}-->
```
<terminalMode>
```
<!--opt, enum, terminal mode, subType:string, desc:"authMode” (authentication mode), "registerMode” (registration mode)-->authMode
```
</terminalMode>
<idCardReader>
```
<!--opt, enum, ID card reader, subType:string, desc:“iDR210”, “DS-K1F110-I”, “DS-K1F1110-B”, “DS-K1F1110-AB”, “none”, “DS-K1F1001-I (USB)”, “DS-K1F1002-
```
```
I (USB)”-->iDR210
```
</idCardReader>
<camera>
<!--opt, enum, camera, subType:string, desc:"C270", "DS-2CS5432B-S"-->C270
</camera>
<fingerPrintModule>
<!--opt, enum, fingerprint module, subType:string, desc:fingerprint module type: ALIWARD,-->ALIWARD
</fingerPrintModule>
<videoStorageTime>
<!--opt, int, time for saving video, range:[0,10], desc:unit: second-->1
</videoStorageTime>
<faceContrastThreshold>
<!--opt, int, face picture comparison threshold, range:[0,100]-->1
</faceContrastThreshold>
<twoDimensionCode>
<!--opt, enum, whether to enable QR code recognition, subType:string, desc:“enable”, “disable”-->enable
</twoDimensionCode>
<blackListCheck>
<!--opt, enum, whether to enable blocklist verification, subType:string, desc:“enable”, “disable”-->enable
</blackListCheck>
<idCardCheckCenter>
```
<!--opt, enum, ID card comparison mode, subType:string, desc:“local” (compare with ID card of local storage), “server” (compare with ID card of remote
```
```
server storage)-->local
```
</idCardCheckCenter>
<faceAlgorithm>
```
<!--opt, enum, face picture algorithm, subType:string, desc:"DeepLearn" (deep learning algorithm), "Tradition" (third-party algorithm)-->DeepLearn
```
</faceAlgorithm>
<comNo>
<!--opt, int, COM No., range:[1,9]-->1
</comNo>
<memoryLearning>
<!--opt, enum, whether to enable learning and memory function, subType:string, desc:“enable”, “disable”-->enable
</memoryLearning>
<saveCertifiedImage>
<!--opt, enum, whether to enable saving authenticated picture, subType:string, desc:“enable”, “disable”-->enable
</saveCertifiedImage>
<MCUVersion>
<!--opt, string, MCU Version-->test
</MCUVersion>
<usbOutput>
<!--opt, enum, whether to enable USB output of ID card reader, subType:string, desc:“enable”, “disable”-->enable
</usbOutput>
<serialOutput>
<!--opt, enum, whether to enable serial port output of ID card reade, subType:string, desc:“enable”, “disable”-->enable
</serialOutput>
<readInfoOfCard>
```
<!--opt, enum, set content to be read from CPU card, subType:string, desc:“serialNo” (read serial No.), “file” (read file)-->serialNo
```
</readInfoOfCard>
<workMode>
<!--opt, enum, authentication mode, subType:string, desc:“passMode”, “accessControlMode”-->passMode
</workMode>
<ecoMode>
<!--opt, object, ECO mode-->
<eco>
<!--opt, enum, whether to enable ECO mode, subType:string, desc:“enable”, “disable”-->enable
</eco>
<faceMatchThreshold1>
<!--opt, int, 1V1 face picture comparison threshold of ECO mode, range:[0,100]-->1
</faceMatchThreshold1>
<faceMatchThresholdN>
<!--opt, int, 1VN face picture comparison threshold of ECO mode, range:[0,100]-->1
</faceMatchThresholdN>
<changeThreshold>
<!--opt, int, ECO mode threshold, range:[0,8], desc:switching threshold of ECO mode,which is between 0 and 8-->0
12.5.7.21 Set the parameters of face recognition terminal
Hikvision co MMC
adil@hikvision.co.az
<!--opt, int, ECO mode threshold, range:[0,8], desc:switching threshold of ECO mode,which is between 0 and 8-->0
</changeThreshold>
<maskFaceMatchThresholdN>
```
<!--opt, int, 1:N face picture (face with mask and normal background picture) comparison threshold of ECO mode, range:[0,100]-->1
```
</maskFaceMatchThresholdN>
<maskFaceMatchThreshold1>
```
<!--opt, int, 1:1 face picture (face with mask and normal background picture) comparison threshold of ECO mode, range:[0,100]-->1
```
</maskFaceMatchThreshold1>
<alwaysInfrared>
<!--opt, bool, whether to enable infrared recognition, desc:if this node exists and changeThreshold is 8, it indicates that the device will not always
enable the infrared recognition-->true
</alwaysInfrared>
<ageFaceMatchList>
<!--opt, array, list of different age groups in ECO mode, subType:object, range:[0,5], desc:before set this node, age group matching should be
enabled, see URL: PUT /ISAPI/AccessControl/FaceCompareCond, and ageFaceMatchEnabled should be true-->
<ageFaceMatch>
<!--opt, object, age group matching in ECO mode-->
<ageLevel>
```
<!--opt, enum, age groups, subType:int, desc:0 (child who are 0~6 years old), 1 (teenager who are 7~17years old), 2 (youth and prime who are 18~40
```
```
years old), 3 (middle age who are 41~65 years old), 4 (elderly who are more than 66 years old)-->1
```
</ageLevel>
<ageFaceMatchThreshold1>
```
<!--opt, int, matching threshold when authenticating via age groups in ECO mode (1:1), range:[0,100]-->1
```
</ageFaceMatchThreshold1>
<ageFaceMatchThresholdN>
```
<!--opt, int, matching threshold when authenticating via age groups in ECO mode (1:N), range:[0,100]-->1
```
</ageFaceMatchThresholdN>
</ageFaceMatch>
</ageFaceMatchList>
</ecoMode>
<readCardRule>
<!--opt, enum, card No. setting rule, subType:string, desc:"wiegand26", "wiegand34"-->wiegand26
</readCardRule>
<enableScreenOff>
<!--opt, bool, whether the device enters the sleep mode when there is no operation after the configured sleep time-->true
</enableScreenOff>
<screenOffTimeout>
```
<!--opt, int, sleep time, range:[0,3600], unit:s, dep:or,{$.IdentityTerminal.enableScreenOff,eq,true}, desc:unit: second-->1
```
</screenOffTimeout>
<enableScreensaver>
<!--opt, bool, whether to enable the screen saver function-->true
</enableScreensaver>
<faceModuleVersion>
<!--opt, string, face recognition module version, range:[1,32]-->test
</faceModuleVersion>
<showMode>
<!--opt, enum, display mode, subType:string, desc:simple mode indicates that the device displays authentication results exclude employee No., name,
```
etc.; the device applies normal mode by default; advertisement mode indicates that the device displays both advertisement and authentication results;
```
```
meeting mode indicates that the device displays check-in page of the conference; custom mode indicates that the device displays layout of the interface
```
```
customized by users; "concise"-simple mode, "normal"-normal mode (default), "advertising"-advertisement mode, "meeting"-meeting mode, "selfDefine"-custom
```
mode-->concise
</showMode>
<popUpPreviewWindow>
```
<!--opt, bool, whether to pop up live view window, dep:or,{$.IdentityTerminal.showMode,eq,advertising}-->true
```
</popUpPreviewWindow>
<needDeviceCheck>
```
<!--opt, bool, whether it need device check in permission free mode, dep:or,{$.IdentityTerminal.workMode,eq,passMode}-->true
```
</needDeviceCheck>
<previewShowTime>
```
<!--opt, int, display duration in live view, range:[1,99], unit:s, dep:or,{$.IdentityTerminal.popUpPreviewWindow,eq,true}-->1
```
</previewShowTime>
<screensaverTimeout>
```
<!--opt, int, range:[0,3600], unit:s, dep:or,{$.IdentityTerminal.enableScreensaver,eq,true}-->1
```
</screensaverTimeout>
<screensaverDuration>
```
<!--opt, int, range:[0,3600], unit:s, dep:or,{$.IdentityTerminal.enableScreensaver,eq,true}-->1
```
</screensaverDuration>
<standbyTimeout>
<!--opt, int, range:[30,1800], unit:s-->30
</standbyTimeout>
<advertisingDisplayType>
```
<!--opt, enum, subType:string, dep:or,{$.IdentityTerminal.showMode,eq,advertising}-->full
```
</advertisingDisplayType>
</IdentityTerminal>
Response Message
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response status, attr:version{req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL, desc:request URL-->test
</requestURL>
<statusCode>
<!--ro, req, enum, status code, subType:int, desc:read-only,status code: 0,1-OK,2-Device Busy,3-Device Error,4-Invalid Operation,5-Invalid XML Format,6-
Invalid XML Content,7-Reboot Required,9-Additional Error-->1
</statusCode>
<statusString>
```
<!--ro, req, enum, read-only,status description, subType:string, desc:“OK” (succeeded), “Device Busy”, “Device Error”, “Invalid Operation”, “Invalid XML
```
```
Format”, “Invalid XML Content”, “Reboot” (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:read-only,describe the error reason in detail-->test
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/AccessControl/IdentityTerminal/capabilities
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<IdentityTerminal xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, parameters of face recognition terminal, attr:version{req, string, protocolVersion}-->
```
<terminalMode opt="authMode,registerMode">
```
<!--ro, opt, enum, terminal mode, subType:string, attr:opt{req, string}, desc:"authMode” (authentication mode), "registerMode” (registration mode)--
```
>authMode
</terminalMode>
<idCardReader opt="iDR210,DS-K1F110-I,DS-K1F1110-B,DS-K1F1110-AB,none ">
```
<!--ro, opt, enum, ID card reader model, subType:string, attr:opt{req, string}, desc:“iDR210”, “DS-K1F110-I”, “DS-K1F1110-B”, “DS-K1F1110-AB”, “none”,
```
```
“DS-K1F1001-I (USB)”, “DS-K1F1002-I (USB)”-->iDR210
```
</idCardReader>
<camera opt="C270,DS-2CS5432B-S">
```
<!--ro, opt, enum, camera, subType:string, attr:opt{req, string}, desc:"C270", "DS-2CS5432B-S"-->C270
```
</camera>
<fingerPrintModule opt="ALIWARD,">
```
<!--ro, opt, enum, fingerprint module, subType:string, attr:opt{req, string}, desc:fingerprint module-->ALIWARD
```
</fingerPrintModule>
<videoStorageTime min="0" max="10">
```
<!--ro, opt, int, time for saving video (unit: second), range:[0,10], attr:min{req, int},max{req, int}, desc:unit: second-->1
```
</videoStorageTime>
<faceContrastThreshold min="0" max="100">
```
<!--ro, opt, int, face picture comparison threshold, range:[0,100], attr:min{req, int},max{req, int}-->1
```
</faceContrastThreshold>
<twoDimensionCode opt="enable,disable">
```
<!--ro, opt, enum, whether to enable QR code recognition, subType:string, attr:opt{req, string}, desc:“enable”, “disable”-->enable
```
</twoDimensionCode>
<blackListCheck opt="enable,disable">
```
<!--ro, opt, enum, whether to enable blocklist verification, subType:string, attr:opt{req, string}, desc:“enable”, “disable”-->enable
```
</blackListCheck>
<idCardCheckCenter opt="local,server">
```
<!--ro, opt, enum, ID card comparison mode, subType:string, attr:opt{req, string}, desc:“local” (compare with ID card of local storage), “server”
```
```
(compare with ID card of remote server storage)-->local
```
</idCardCheckCenter>
<faceAlgorithm opt="DeepLearn,Tradition">
```
<!--ro, opt, enum, face picture algorithm, subType:string, attr:opt{req, string}, desc:"DeepLearn" (deep learning algorithm), "Tradition" (third-party
```
```
algorithm)-->DeepLearn
```
</faceAlgorithm>
<comNo min="1" max="9">
```
<!--ro, opt, int, COM No., range:[1,9], attr:min{req, int},max{req, int}-->1
```
</comNo>
<memoryLearning opt="enable,disable">
```
<!--ro, opt, enum, whether to enable learning and memory function, subType:object, attr:opt{req, string}, desc:“enable”, “disable”-->enable
```
</memoryLearning>
<saveCertifiedImage opt="enable,disable">
```
<!--ro, opt, enum, whether to enable saving authenticated picture, subType:string, attr:opt{req, string}, desc:“enable”, “disable”-->enable
```
</saveCertifiedImage>
<MCUVersion min="1" max="10">
```
<!--ro, opt, string, MCU version information, attr:min{req, int},max{req, int}-->test
```
</MCUVersion>
<usbOutput opt="enable,disable">
```
<!--ro, opt, enum, whether to enable USB output of ID card reader, subType:string, attr:opt{req, string}, desc:“enable”, “disable”-->enable
```
</usbOutput>
<serialOutput opt="enable,disable">
12.5.7.22 Get configuration capability of face recognition terminal
Hikvision co MMC
adil@hikvision.co.az
<serialOutput opt="enable,disable">
```
<!--ro, opt, enum, whether to enable serial port output of ID card reader, subType:string, attr:opt{req, string}, desc:“enable”, “disable”-->enable
```
</serialOutput>
<readInfoOfCard opt="serialNo,file">
```
<!--ro, opt, enum, set content to be read from CPU card, subType:string, attr:opt{req, string}, desc:"serialNo" (read the serial No.), "file" (read the
```
```
file)-->serialNo
```
</readInfoOfCard>
<workMode opt="passMode,accessControlMode">
```
<!--ro, opt, enum, authentication mode, subType:string, attr:opt{req, string}, desc:authentication mode-->passMode
```
</workMode>
<ecoMode>
<!--ro, opt, object, ECO mode-->
<eco opt="enable,disable">
```
<!--ro, opt, enum, whether to enable ECO mode, subType:string, attr:opt{req, string}, desc:“enable”, “disable”-->enable
```
</eco>
<faceMatchThreshold1 min="0" max="100">
```
<!--ro, opt, int, 1V1 face picture comparison threshold of ECO mod, range:[0,100], attr:min{req, int},max{req, int}-->1
```
</faceMatchThreshold1>
<faceMatchThresholdN min="0" max="100">
```
<!--ro, opt, int, 1:N face picture comparison threshold of ECO mode, range:[0,100], attr:min{req, int},max{req, int}-->1
```
</faceMatchThresholdN>
<changeThreshold min="0" max="8">
```
<!--ro, opt, int, switching threshold of ECO mode, range:[0,8], attr:min{req, int},max{req, int}, desc:switching threshold of ECO mode,which is
```
between 0 and 8-->0
</changeThreshold>
<maskFaceMatchThresholdN min="0" max="100">
```
<!--ro, opt, int, 1:N face picture (face with mask and normal background picture) comparison threshold of ECO mode, range:[0,100], attr:min{req,
```
```
int},max{req, int}-->1
```
</maskFaceMatchThresholdN>
<maskFaceMatchThreshold1 min="0" max="100">
```
<!--ro, opt, int, 1:1 face picture (face with mask and normal background picture) comparison threshold of ECO mode, range:[0,100], attr:min{req,
```
```
int},max{req, int}-->1
```
</maskFaceMatchThreshold1>
<alwaysInfrared opt="true,false">
```
<!--ro, opt, bool, whether to enable infrared recognition, attr:opt{req, string}, desc:if this node exists and changeThreshold is 8, it indicates that
```
the device will not always enable the infrared recognition-->true
</alwaysInfrared>
<ageFaceMatchList size="5">
```
<!--ro, opt, array, list of different age groups in ECO mode, subType:object, range:[0,5], attr:size{req, int}-->
```
<ageFaceMatch>
<!--ro, opt, object, age group matching in ECO mode-->
<ageLevel opt="0,1,2,3,4">
```
<!--ro, opt, enum, age groups, subType:int, attr:opt{req, string}, desc:0 (child who are 0~6 years old), 1 (teenager who are 7~17years old), 2
```
```
(youth and prime who are 18~40 years old), 3 (middle age who are 41~65 years old), 4 (elderly who are more than 66 years old)-->1
```
</ageLevel>
<ageFaceMatchThreshold1 min="0" max="100">
```
<!--ro, opt, int, matching threshold when authenticating via age groups in ECO mode (1:1), range:[0,100], attr:min{req, int},max{req, int}-->1
```
</ageFaceMatchThreshold1>
<ageFaceMatchThresholdN min="0" max="100">
```
<!--ro, opt, int, matching threshold when authenticating via age groups in ECO mode (1:N), range:[0,100], attr:min{req, int},max{req, int}-->1
```
</ageFaceMatchThresholdN>
</ageFaceMatch>
</ageFaceMatchList>
</ecoMode>
<readCardRule opt="wiegand26,wiegand34">
```
<!--ro, opt, enum, card No. setting rule, subType:string, attr:opt{req, string}, desc:card No. setting rule: "wiegand26","wiegand34"-->wiegand26
```
</readCardRule>
<enableScreenOff opt="true,false">
```
<!--ro, opt, bool, whether the device enters the sleep mode when there is no operation after the configured sleep time, attr:opt{req, string}-->true
```
</enableScreenOff>
<screenOffTimeout min="0" max="3600">
```
<!--ro, opt, int, sleep time, range:[0,3600], unit:s, attr:min{req, int},max{req, int}-->1
```
</screenOffTimeout>
<enableScreensaver opt="true,false">
```
<!--ro, opt, bool, whether to enable the screen saver function, attr:opt{req, string}-->true
```
</enableScreensaver>
<faceModuleVersion min="0" max="10">
```
<!--ro, opt, string, face recognition module version, attr:min{req, int},max{req, int}-->test
```
</faceModuleVersion>
<showMode opt="concise,normal,advertising,meeting,selfDefine,boxStatus,clock">
```
<!--ro, opt, enum, display mode, subType:string, attr:opt{req, string}, desc:"concise" (simple mode,only the authentication result will be displayed),
```
```
"normal" (normal mode). The default mode is normal mode. If this node does not exist, the default mode is normal mode-->concise
```
</showMode>
<popUpPreviewWindow opt="true,false">
```
<!--ro, opt, bool, whether to pop up live view window, dep:or,{$.IdentityTerminal.showMode,eq,advertising}, attr:opt{req, string}-->true
```
</popUpPreviewWindow>
<needDeviceCheck opt="true,false">
```
<!--ro, opt, bool, whether it need device check in permission free mode, dep:or,{$.IdentityTerminal.workMode,eq,passMode}, attr:opt{req, string}-->true
```
</needDeviceCheck>
<previewShowTime min="1" max="99">
```
<!--ro, opt, int, display duration in live view, range:[1,99], unit:s, attr:min{req, int},max{req, int}-->1
```
</previewShowTime>
<screensaverTimeout min="0" max="3600">
```
<!--ro, opt, int, range:[0,3600], unit:s, attr:min{req, int},max{req, int}-->1
```
</screensaverTimeout>
<screensaverDuration min="0" max="3600">
```
<!--ro, opt, int, range:[0,3600], unit:s, attr:min{req, int},max{req, int}-->1
```
</screensaverDuration>
<standbyTimeout min="30" max="1800">
```
<!--ro, opt, int, range:[30,1800], unit:s, attr:min{req, int},max{req, int}-->30
```
</standbyTimeout>
<advertisingDisplayType opt="full,split">
```
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->full
```
</advertisingDisplayType>
Hikvision co MMC
adil@hikvision.co.az
</advertisingDisplayType>
</IdentityTerminal>
Request URL
PUT /ISAPI/AccessControl/M1CardEncryptCfg
Query Parameter
None
Request Message
<?xml version="1.0" encoding="UTF-8"?>
<M1CardEncryptCfg xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--req, object, configuration capability of the M1 card encryption verification, attr:version{req, string, protocolVersion}-->
```
<enable>
<!--req, bool, whether to enable the function-->true
</enable>
<sectionID>
<!--req, int, sector ID, desc:only one sector can be configured at a time-->1
</sectionID>
</M1CardEncryptCfg>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response status, attr:version{req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL, desc:request URL-->test
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:string, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->1
```
</statusCode>
<statusString>
<!--ro, req, enum, status description, subType:string, desc:"OK,Device Busy,Device Error,Invalid Operation,Invalid XML Format,Invalid XML
Content,Reboot"-->OK
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code description-->test
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/AccessControl/M1CardEncryptCfg
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<M1CardEncryptCfg xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, configuration capability of the M1 card encryption verification, attr:version{req, string, protocolVersion}-->
```
<enable>
<!--ro, req, bool, whether to enable the function-->true
</enable>
<sectionID>
<!--ro, req, int, sector ID, desc:sector ID,only one sector can be configured at a time-->1
</sectionID>
</M1CardEncryptCfg>
12.5.7.23 Set the parameters of M1 card encryption verification
12.5.7.24 Get the configuration parameters of M1 card encryption verification
12.5.7.25 Get the configuration capability of the M1 card encryption verification
Hikvision co MMC
adil@hikvision.co.az
Request URL
GET /ISAPI/AccessControl/M1CardEncryptCfg/capabilities
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<M1CardEncryptCfg xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, configuration capability of the M1 card encryption verification, attr:version{req, string, protocolVersion}-->
```
<enable opt="true,false">
```
<!--ro, req, bool, whether to enable, attr:opt{req, string}-->true
```
</enable>
<sectionID min="0" max="100">
```
<!--ro, req, int, sector ID, range:[0,100], attr:min{req, int},max{req, int}-->1
```
</sectionID>
</M1CardEncryptCfg>
Request URL
GET /ISAPI/AccessControl/WiegandCfg/capabilities
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<WiegandCfg xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, configuration of Wiegand parameters, attr:version{req, string, protocolVersion}-->
```
<wiegandNo min="1" max="4" opt="1,4">
```
<!--ro, req, int, Wiegand interface No., range:[0,4], step:1, attr:min{opt, int},max{opt, int},opt{opt, string}, desc:Wiegand interface No.-->1
```
</wiegandNo>
<communicateDirection opt="receive,send">
```
<!--ro, req, enum, communication direction, subType:string, attr:opt{req, string}, desc:"receive", "send"-->receive
```
</communicateDirection>
<wiegandMode
```
opt="wiegand26,wiegand34,wiegand27,wiegand35,Corporate1000_35,Corporate1000_48,H10302_37,H10304_37,wiegand_26CSN,H103130_32CSN,wiegand_56CSN,wiegand_58">
```
```
<!--ro, opt, enum, Wiegand mode, subType:string, attr:opt{req, string}, desc:Wiegand mode-->wiegand26
```
</wiegandMode>
<inputWiegandMode>
```
<!--ro, opt, enum, subType:string, dep:or,{$.WiegandCfg.communicateDirection,eq,receive}-->wiegand26
```
</inputWiegandMode>
<signalInterval min="1" max="20">
```
<!--ro, opt, int, it is between 1 and 20,unit: ms, range:[1,20], attr:min{req, int},max{req, int}, desc:it is between 1 and 20,unit: ms-->1
```
</signalInterval>
<enable opt="true,false">
```
<!--ro, opt, bool, whether to enable Wiegand parameters, attr:opt{req, string}-->true
```
</enable>
<pulseDuration min="1" max="10">
```
<!--ro, opt, int, pulse duration, range:[1,10], attr:min{req, int},max{req, int}, desc:pulse duration-->1
```
</pulseDuration>
<facilityCodeEnabled opt="true,false">
```
<!--ro, opt, bool, whether to enable facilityCode, attr:opt{req, string}-->true
```
</facilityCodeEnabled>
<facilityCode min="0" max="65535">
```
<!--ro, opt, int, range:[0,65535], dep:and,{$.WiegandCfg.facilityCodeEnabled,eq,true}, attr:min{req, int, range:[0,65535]},max{req, int, range:
```
```
[0,65535]}-->1
```
</facilityCode>
<dataType opt="employeeNo,cardNo">
```
<!--ro, opt, enum, data type, subType:string, dep:or,{$.WiegandCfg.wiegandMode,eq,send}, attr:opt{req, string}, desc:data type-->employeeNo
```
</dataType>
</WiegandCfg>
Request URL
12.5.7.26 Get the capability of Wiegand parameters
12.5.7.27 Set Wiegand parameters
Hikvision co MMC
adil@hikvision.co.az
PUT /ISAPI/AccessControl/WiegandCfg/wiegandNo/<wiegandID>
Query Parameter
Parameter Name Parameter Type Description
wiegandID string --
Request Message
<?xml version="1.0" encoding="UTF-8"?>
<WiegandCfg xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--wo, req, object, Wiegand parameters, attr:version{req, string, protocolVersion}-->
```
<communicateDirection>
<!--wo, req, enum, communication direction, subType:string, desc:"receive", "send"-->receive
</communicateDirection>
<wiegandMode>
```
<!--wo, opt, enum, Wiegand mode, subType:string, dep:or,{$.WiegandCfg.communicateDirection,eq,send}, desc:"wiegand26", "wiegand34", "wiegand27",
```
"wiegand35", "Corporate1000_35", "Corporate1000_48", "H10302_37", "H10304_37", "wiegand_26CSN", "H103130_32CSN", "wiegand_56CSN", "wiegand_58"-->wiegand26
</wiegandMode>
<inputWiegandMode>
```
<!--wo, opt, enum, subType:string, dep:or,{$.WiegandCfg.communicateDirection,eq,receive}-->wiegand26
```
</inputWiegandMode>
<signalInterval>
<!--wo, opt, int, it is between 1 and 20,unit: ms, range:[1,20], desc:unit: ms-->1
</signalInterval>
<enable>
<!--wo, opt, bool, whether to enable the function or not-->true
</enable>
<pulseDuration>
<!--wo, opt, int, range:[1,10]-->1
</pulseDuration>
<facilityCodeEnabled>
<!--opt, bool-->true
</facilityCodeEnabled>
<facilityCode>
```
<!--opt, int, range:[0,65535], dep:and,{$.WiegandCfg.facilityCodeEnabled,eq,true}-->1
```
</facilityCode>
<dataType>
```
<!--opt, enum, data type, subType:string, dep:or,{$.WiegandCfg.wiegandMode,eq,send}, desc:data type-->employeeNo
```
</dataType>
</WiegandCfg>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, which describes the error in details, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/AccessControl/WiegandCfg/wiegandNo/<wiegandID>
Query Parameter
Parameter Name Parameter Type Description
wiegandID string --
Request Message
None
12.5.7.28 Get Wiegand parameters
Hikvision co MMC
adil@hikvision.co.az
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<WiegandCfg xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, Wiegand parameters, attr:version{req, string, protocolVersion}-->
```
<communicateDirection>
<!--ro, req, enum, communication direction, subType:string, desc:"receive", "send"-->receive
</communicateDirection>
<wiegandMode>
```
<!--ro, opt, enum, Wiegand mode, subType:string, dep:or,{$.WiegandCfg.communicateDirection,eq,send}, desc:"wiegand26", "wiegand34", "wiegand27",
```
"wiegand35", "Corporate1000_35", "Corporate1000_48", "H10302_37", "H10304_37", "wiegand_26CSN", "H103130_32CSN", "wiegand_56CSN", "wiegand_58"-->wiegand26
</wiegandMode>
<sequenceOrder>
<!--ro, opt, enum, subType:string-->normal
</sequenceOrder>
<inputWiegandMode>
```
<!--ro, opt, enum, subType:string, dep:or,{$.WiegandCfg.communicateDirection,eq,receive}-->wiegand26
```
</inputWiegandMode>
<signalInterval>
<!--ro, opt, int, Wiegand signal sending interval, range:[1,20], desc:unit: ms-->1
</signalInterval>
<enable>
<!--ro, opt, bool, whether to enable the function or not-->true
</enable>
<pulseDuration>
<!--ro, opt, int, range:[1,10]-->1
</pulseDuration>
<facilityCodeEnabled>
<!--ro, opt, bool-->true
</facilityCodeEnabled>
<facilityCode>
```
<!--ro, opt, int, range:[0,65535], dep:and,{$.WiegandCfg.facilityCodeEnabled,eq,true}-->1
```
</facilityCode>
<dataType>
```
<!--ro, opt, enum, data type, subType:string, dep:or,{$.WiegandCfg.wiegandMode,eq,send}, desc:data type-->employeeNo
```
</dataType>
<MSBEnabled>
```
<!--ro, opt, bool, dep:or,{$.WiegandCfg.wiegandMode,eq,wiegand26Sha1},{$.WiegandCfg.wiegandMode,eq,wiegand34Sha1}-->true
```
</MSBEnabled>
</WiegandCfg>
Request URL
GET /ISAPI/AccessControl/MultiDoorInterLockCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.8 Multi-Door Interlocking
12.5.8.1 Get the capability of configuring the multi-door interlocking
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"MultiDoorInterLockCfg": {
```
/*ro, opt, object*/
"enable": "true,false",
/*ro, req, string, whether to enable multi-door interlocking*/
```
"MultiDoorGroup": {
```
/*ro, opt, object, parameters of the multi-door interlocking group*/
"maxSize": 8,
/*ro, opt, int, the maximum value*/
```
"id": {
```
/*ro, opt, object, multi-door interlocking No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 8
/*ro, opt, int, the maximum value*/
```
},
```
```
"doorNoList": {
```
/*ro, opt, object, door No. list of multi-door interlocking*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 8
/*ro, opt, int, the maximum value*/
```
},
```
```
"doorNoListLen": {
```
/*ro, opt, object, range of the list length of multi-door interlocking, desc:e.g., the list length of [1,3,5] is 3*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 8
/*ro, opt, int, the maximum value*/
```
}
```
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/MultiDoorInterLockCfg?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"MultiDoorInterLockCfg": {
```
/*ro, opt, object*/
"enable": true,
/*ro, req, bool, whether to enable multi-door interlocking*/
"MultiDoorGroup": [
/*ro, opt, array, parameters of the multi-door interlocking group, subType:object*/
```
{
```
"id": 1,
/*ro, opt, int, multi-door interlocking No.*/
"doorNoList": [1, 3, 5]
/*ro, opt, array, door No. list of multi-door interlocking, subType:int*/
```
}
```
]
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/MultiDoorInterLockCfg?format=json
Query Parameter
None
Request Message
12.5.8.2 Get the multi-door interlocking configuration parameters
12.5.8.3 Set multi-door interlocking parameters
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"MultiDoorInterLockCfg": {
```
/*opt, object, multi-door interlocking parameters*/
"enable": true,
/*req, bool, whether to enable multi-door interlocking*/
"MultiDoorGroup": [
/*opt, array, parameters of the multi-door interlocking group, subType:object*/
```
{
```
"id": 1,
/*opt, int, multi-door interlocking No.*/
"doorNoList": [1, 3, 5]
/*opt, array, door No. list of multi-door interlocking, subType:int*/
```
}
```
]
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": "test",
/*ro, opt, string, status code*/
"statusString": "test",
/*ro, opt, string, status description*/
"subStatusCode": "test",
/*ro, opt, string, sub status code*/
"errorCode": 1,
/*ro, req, int, error code*/
"errorMsg": "ok"
/*ro, req, string, error information*/
```
}
```
Request URL
GET /ISAPI/AccessControl/ClearGroupCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"ClearGroupCfg": {
```
/*ro, opt, object*/
```
"ClearFlags": {
```
/*ro, opt, object*/
"groupCfg": "true,false"
/*ro, req, string, group parameters*/
```
}
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/ClearGroupCfg?format=json
Query Parameter
None
Request Message
12.5.9 Multi-Factor Authentication
12.5.9.1 Get the capability of clearing group parameters
12.5.9.2 Clear group parameters
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"ClearGroupCfg": {
```
/*opt, object, group parameters*/
```
"ClearFlags": {
```
/*opt, object*/
"groupCfg": true
/*req, bool, whether to clear group parameters*/
```
}
```
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": "test",
/*ro, opt, string, status code*/
"statusString": "test",
/*ro, opt, string, status description*/
"subStatusCode": "test",
/*ro, opt, string, sub status code*/
"errorCode": 1,
/*ro, req, int, error code*/
"errorMsg": "ok"
/*ro, req, string, error description*/
```
}
```
Request URL
GET /ISAPI/AccessControl/GroupCfg/<groupID>?format=json
Query Parameter
Parameter Name Parameter Type Description
groupID string Group No., which starts from 1.
Request Message
None
Response Message
```
{
```
```
"GroupCfg": {
```
/*ro, req, object, group parameters*/
"enable": true,
/*ro, req, bool, whether to enable the function*/
```
"ValidPeriodCfg": {
```
/*ro, req, object, validity period of the group*/
"enable": true,
/*ro, req, bool, whether to enable validity period, desc:whether to enable validity period*/
"beginTime": "1970-01-01T00:00:00+08:00",
```
/*ro, req, datetime, start time of the validity period (UTC time)*/
```
"endTime": "1970-01-01T00:00:00+08:00"
```
/*ro, req, datetime, end time of the validity period (UTC time)*/
```
```
},
```
"groupName": "test"
/*ro, opt, string, range:[0,32]*/
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/GroupCfg/<groupID>?format=json
Query Parameter
Parameter Name Parameter Type Description
groupID string --
12.5.9.3 Get the group configuration parameters
12.5.9.4 Set the group parameters
Hikvision co MMC
adil@hikvision.co.az
Request Message
```
{
```
```
"GroupCfg": {
```
/*opt, object, group parameters*/
"enable": true,
/*req, bool, whether to enable the group*/
```
"ValidPeriodCfg": {
```
/*opt, object, validity period of the group*/
"enable": true,
/*req, bool, whether to enable validity period*/
"beginTime": "1970-01-01T00:00:00+08:00",
```
/*req, datetime, start time of the validity period (UTC time)*/
```
"endTime": "1970-01-01T00:00:00+08:00"
```
/*req, datetime, end time of the validity period (UTC time)*/
```
```
},
```
"groupName": "test"
/*opt, string, group name*/
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, request URL*/
"statusCode": "test",
/*ro, opt, string, status code*/
"statusString": "test",
/*ro, opt, string, status description*/
"subStatusCode": "test",
/*ro, opt, string, sub status code*/
"errorCode": 1,
/*ro, req, int, error code*/
"errorMsg": "ok"
/*ro, req, string, error information*/
```
}
```
Request URL
GET /ISAPI/AccessControl/GroupCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.9.5 Get the group configuration capability
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"GroupCfg": {
```
/*ro, opt, object, group parameters*/
```
"groupNo": {
```
/*ro, opt, object, group No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 1
/*ro, opt, int, the maximum value*/
```
},
```
"enable": "true,false",
/*ro, req, string, whether to enable the group*/
```
"ValidPeriodCfg": {
```
/*ro, req, object, whether to enable validity period parameters of the group*/
"enable": "true,false",
/*ro, req, string, whether to enable validity period*/
```
"beginTime": {
```
```
/*ro, req, object, start time of the validity period (UTC time)*/
```
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 32
/*ro, opt, int, the maximum value*/
```
},
```
```
"endTime": {
```
```
/*ro, req, object, end time of the validity period (UTC time)*/
```
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 32
/*ro, opt, int, the maximum value*/
```
}
```
```
},
```
```
"groupName": {
```
/*ro, opt, object, group name*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 32
/*ro, opt, int, the maximum value*/
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/MultiCardCfg/<doorID>?format=json
Query Parameter
Parameter Name Parameter Type Description
doorID string Door No.
Request Message
None
Response Message
12.5.9.6 Get the configuration parameters of multi-factor authentication mode
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"MultiCardCfg": {
```
/*ro, opt, object*/
"doorName": "test",
/*ro, opt, string, range:[0,64]*/
"doorRegionName": "test",
/*ro, opt, string, range:[0,64]*/
"enable": true,
/*ro, req, bool, whether to enable multi-factor authentication*/
"swipeIntervalTimeout": 10,
```
/*ro, opt, int, timeout of swiping (authentication) interval*/
```
"GroupCfg": [
/*ro, opt, array, multi-factor authentication parameters, subType:object*/
```
{
```
"id": 1,
/*ro, opt, int, multi-factor authentication No.*/
"name": "test",
/*ro, opt, string, range:[0,64]*/
"enable": true,
/*ro, opt, bool, whether to enable multi-factor authentication*/
"enableOfflineVerifyMode": true,
```
/*ro, opt, bool, whether to enable verification mode when the access control device is offline (the super password will replace opening door
```
```
remotely)*/
```
"templateNo": 1,
/*ro, opt, int, schedule template No. to enable the multi-factor authentication*/
"templateName": "test",
/*ro, opt, string, range:[0,64]*/
"GroupCombination": [
/*ro, opt, array, multi-factor authentication parameters, subType:object*/
```
{
```
"enable": true,
/*ro, opt, bool, whether to enable multi-factor authentication*/
"memberNum": 3,
/*ro, opt, int, number of members swiping cards*/
"sequenceNo": 1,
/*ro, opt, int, serial No. of swiping cards of the multi-factor authentication group*/
"groupNo": 1,
/*ro, opt, int, group No., desc:group No.*/
"groupName": "test"
/*ro, opt, string, range:[0,64]*/
```
}
```
]
```
}
```
]
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/MultiCardCfg/<doorID>?format=json
Query Parameter
Parameter Name Parameter Type Description
doorID string --
Request Message
12.5.9.7 Set parameters of multi-factor authentication mode
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"MultiCardCfg": {
```
/*opt, object, parameters of multi-factor authentication mode*/
"enable": true,
/*req, bool, whether to enable multi-factor authentication*/
"swipeIntervalTimeout": 10,
```
/*opt, int, timeout of swiping (authentication) interval*/
```
"GroupCfg": [
/*opt, array, multi-factor authentication parameters, subType:object*/
```
{
```
"id": 1,
/*opt, int, multi-factor authentication No.*/
"enable": true,
/*opt, bool, whether to enable multi-factor authentication*/
"enableOfflineVerifyMode": true,
```
/*opt, bool, whether to enable verification mode when the access control device is offline (the super password will replace opening door
```
```
remotely)*/
```
"templateNo": 1,
/*opt, int, schedule template No. to enable the multi-factor authentication*/
"GroupCombination": [
/*opt, array, parameters of the multi-factor authentication group, subType:object*/
```
{
```
"enable": true,
/*opt, bool, whether to enable multi-factor authentication*/
"memberNum": 3,
/*opt, int, number of members swiping cards*/
"sequenceNo": 1,
/*opt, int, serial No. of swiping cards of the multi-factor authentication group*/
"groupNo": 1
/*opt, int, group No.*/
```
}
```
]
```
}
```
]
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": "test",
/*ro, opt, string, status code*/
"statusString": "test",
/*ro, opt, string, status description*/
"subStatusCode": "test",
/*ro, opt, string, sub status code*/
"errorCode": 1,
/*ro, req, int, error code*/
"errorMsg": "ok"
/*ro, req, string, error information*/
```
}
```
Request URL
GET /ISAPI/AccessControl/MultiCardCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.9.8 Get the configuration capability of multi-factor authentication modeHikvision co MMC
adil@hikvision.co.az
```
{
```
```
"MultiCardCfg": {
```
/*ro, opt, object*/
```
"doorNo": {
```
/*ro, opt, object, door No.*/
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 256
/*ro, opt, int, maximum value*/
```
},
```
"enable": "true,false",
/*ro, req, string, whether to enable multi-factor authentication*/
```
"swipeIntervalTimeout": {
```
```
/*ro, opt, object, timeout of swiping (authentication) interval*/
```
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 255
/*ro, opt, int, maximum value*/
```
},
```
```
"GroupCfg": {
```
/*ro, opt, object, multi-factor authentication parameters*/
"maxSize": 20,
/*ro, opt, int, maximum value*/
```
"id": {
```
/*ro, opt, object, multi-factor authentication No.*/
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 20
/*ro, opt, int, maximum value*/
```
},
```
"enable": "true,false",
/*ro, opt, string, whether to enable multi-factor authentication*/
"enableOfflineVerifyMode": "true,false",
```
/*ro, opt, string, whether to enable verification mode when the access control device is offline (the super password will replace opening door
```
```
remotely)*/
```
```
"templateNo": {
```
/*ro, opt, object, schedule template No. to enable the multi-factor authentication*/
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 20
/*ro, opt, int, maximum value*/
```
},
```
```
"GroupCombination": {
```
/*ro, opt, object, parameters of the multi-factor authentication group*/
"maxSize": 8,
/*ro, opt, int, maximum value*/
"enable": "true,false",
/*ro, opt, string, whether to enable multi-factor authentication*/
```
"memberNum": {
```
/*ro, opt, object, number of members swiping cards*/
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 20
/*ro, opt, int, maximum value*/
```
},
```
```
"sequenceNo": {
```
/*ro, opt, object, serial No. of swiping cards of the multi-factor authentication group*/
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 8
/*ro, opt, int, maximum value*/
```
},
```
```
"groupNo": {
```
/*ro, opt, object, group No.*/
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 20
/*ro, opt, int, the maximum value*/
```
}
```
```
}
```
```
}
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/UserRightHolidayGroupCfg/<holidayGroupID>?format=json
Query Parameter
12.5.10 Permission Schedules for Persons and Access Points
12.5.10.1 Set the holiday group parameters of the access permission control schedule
Hikvision co MMC
adil@hikvision.co.az
Parameter Name Parameter Type Description
holidayGroupID string --
Request Message
```
{
```
```
"UserRightHolidayGroupCfg": {
```
/*req, object, the holiday group parameters of the access permission control schedule*/
"enable": true,
```
/*req, bool, whether to enable, desc:true (yes), false (no)*/
```
"groupName": "test",
/*req, string, holiday group name*/
"holidayPlanNo": "1,3,5",
/*req, string, holiday group schedule No., desc:holiday group schedule No.*/
"operateType": "byTerminal",
```
/*opt, enum, operation type, subType:string, desc:"byTerminal" (by terminal), "byOrg" (by organization), "byTerminalOrg" (by terminal
```
```
organization)*/
```
"terminalNoList": [1, 2, 3, 4],
/*opt, array, terminal ID list, subType:int, desc:this node is required when operation type is "byTerminal" or "byTerminalOrg"*/
"orgNoList": [1, 2, 3, 4]
/*opt, array, organization ID list, subType:int, desc:this node is required when operation type is "byOrg" or "byTerminalOrg"*/
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": "test",
```
/*ro, opt, string, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "test",
```
/*ro, opt, string, status description, desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "test",
```
/*ro, opt, string, sub status code, desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, req, int, error code, desc:it is required when the value of statusCode is not 1, and it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, req, string, error information, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/UserRightHolidayGroupCfg/<holidayGroupID>?format=json
Query Parameter
Parameter
Name
Parameter
Type Description
holidayGroupID string It starts from 1. The maximum value supported by the device is obtained from thecapability set.
Request Message
None
Response Message
```
{
```
```
"UserRightHolidayGroupCfg": {
```
/*ro, req, object*/
"enable": true,
```
/*ro, req, bool, whether to enable, desc:true (yes), false (no)*/
```
"groupName": "test",
/*ro, req, string, holiday group name*/
"holidayPlanNo": "1,3,5",
/*ro, req, string, holiday group schedule No., desc:holiday group schedule No.*/
"holidayPlanName": ["test1", "test3", "test5"]
/*ro, opt, array, subType:string*/
```
}
```
```
}
```
12.5.10.2 Get the holiday group configuration parameters of the access permission control schedule
Hikvision co MMC
adil@hikvision.co.az
Request URL
GET /ISAPI/AccessControl/UserRightHolidayGroupCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"UserRightHolidayGroupCfg": {
```
/*ro, req, object*/
```
"groupNo": {
```
/*ro, opt, object, holiday group No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether it is enabled, desc:"true" (enabled), "false" (disabled)*/
```
```
"groupName": {
```
/*ro, opt, object, holiday group name*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 32
/*ro, opt, int, the maximum value*/
```
},
```
```
"holidayPlanNo": {
```
/*ro, opt, object, holiday group schedule No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
}
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/UserRightHolidayPlanCfg/<holidayPlanID>?format=json
Query Parameter
Parameter Name Parameter Type Description
holidayPlanID string --
Request Message
12.5.10.3 Get the holiday group configuration capability of the access permission control
12.5.10.4 Set the holiday schedule parameters of the access permission control
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"UserRightHolidayPlanCfg": {
```
/*req, object, the holiday schedule parameters of the access permission control*/
"enable": true,
```
/*req, bool, whether to enable, desc:"true" (enable), "false" (disable)*/
```
"beginDate": "1970-01-01",
/*req, date, start date of the holiday, desc:device local time*/
"endDate": "1970-01-01",
/*req, date, end date of the holiday, desc:device local time*/
"HolidayPlanCfg": [
/*req, array, subType:object*/
```
{
```
"id": 1,
/*req, int, time period No., range:[1,8], desc:it is between 1 and 8*/
"enable": true,
```
/*req, bool, whether to enable, desc:"true" (enable), "false" (disable)*/
```
```
"TimeSegment": {
```
/*opt, object, time period*/
"beginTime": "00:00:00",
/*req, time, start time of the time period, desc:device local time*/
"endTime": "00:00:00"
/*req, time, end time of the time period, desc:device local time*/
```
},
```
"authenticationTimesEnabled": true,
/*opt, bool*/
"authenticationTimes": 10
/*opt, int, range:[1,255], step:1*/
```
}
```
]
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": "test",
```
/*ro, opt, string, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "test",
```
/*ro, opt, string, status description, desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "test",
```
/*ro, opt, string, sub status code, desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:it is required when the value of statusCode is not 1, and it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/UserRightHolidayPlanCfg/<holidayPlanID>?format=json
Query Parameter
Parameter
Name
Parameter
Type Description
holidayPlanID string Holiday schedule No., which starts from 1, and the maximum value supported by thedevice is obtained from the capability set.
Request Message
None
Response Message
12.5.10.5 Get holiday schedule configuration parameters
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"UserRightHolidayPlanCfg": {
```
/*ro, req, object, holiday schedule configuration parameters*/
"enable": true,
```
/*ro, req, bool, whether to enable, desc:true (enable), false (disable)*/
```
"holidayPlanName": "test",
/*ro, opt, string, range:[0,64]*/
"beginDate": "1970-01-01",
/*ro, req, date, start date of the holiday, desc:device local time*/
"endDate": "1970-01-01",
/*ro, req, date, end date of the holiday, desc:device local time*/
"cycleByYear": true,
/*ro, opt, bool*/
"HolidayPlanCfg": [
/*ro, req, array, holiday schedule parameters, subType:object*/
```
{
```
"id": 1,
/*ro, req, int, time period No., range:[1,8], desc:it is between 1 and 8*/
"enable": true,
```
/*ro, req, bool, whether to enable, desc:true (enable), false (disable)*/
```
```
"TimeSegment": {
```
/*ro, req, object, time period*/
"beginTime": "00:00:00",
/*ro, req, time, start time of the time period, desc:device local time*/
"endTime": "00:00:00"
/*ro, req, time, end time of the time period, desc:device local time*/
```
},
```
"authenticationTimesEnabled": true,
/*ro, opt, bool*/
"authenticationTimes": 10
/*ro, opt, int, range:[0,255], step:1*/
```
}
```
]
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/UserRightHolidayPlanCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.10.6 Get the holiday schedule configuration capability of the access permission control
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"UserRightHolidayPlanCfg": {
```
/*ro, req, object*/
```
"planNo": {
```
/*ro, opt, object, holiday schedule No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether it is enabled, desc:"true" (enabled), "false" (disabled)*/
```
"beginDate": "1970-01-01",
```
/*ro, opt, date, start date of the holiday, desc:(device local time)*/
```
"endDate": "1970-01-01",
```
/*ro, opt, date, end date of the holiday, desc:(device local time)*/
```
```
"HolidayPlanCfg": {
```
/*ro, opt, object, holiday schedule parameter*/
"maxSize": 8,
/*ro, opt, int, the maximum value*/
```
"id": {
```
/*ro, opt, object, time period No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 8
/*ro, opt, int, the maximum value*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether it is enabled, desc:"true" (enabled), "false" (disabled)*/
```
```
"TimeSegment": {
```
/*ro, opt, object, time period*/
"beginTime": "00:00:00",
```
/*ro, opt, time, start time, desc:(device local time)*/
```
"endTime": "00:00:00",
```
/*ro, opt, time, end time, desc:(device local time)*/
```
"validUnit": "minute"
/*ro, opt, enum, time accuracy, subType:string, desc:"hour", "minute", "second". If this node is not returned, the default time accuracy is
"minute"*/
```
},
```
```
"authenticationTimesEnabled": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, req, array, subType:bool*/
```
},
```
```
"authenticationTimes": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, req, int, range:[1,255], step:1*/
"@max": 255
/*ro, req, int, range:[1,255], step:1*/
```
}
```
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/UserRightPlanTemplate/<planTemplateID>?format=json
Query Parameter
Parameter
Name
Parameter
Type Description
planTemplateID string Schedule template No., which starts from 1, and the maximum value supported by thedevice is obtained from the capability set.
Request Message
None
Response Message
12.5.10.7 Get the schedule template configuration parameters of the access permission control
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"UserRightPlanTemplate": {
```
/*ro, req, object*/
"enable": true,
```
/*ro, req, bool, whether to enable, desc:true (yes), false (no)*/
```
"templateName": "test",
/*ro, req, string, template name*/
"weekPlanNo": 1,
/*ro, req, int, week schedule No., desc:week schedule No.*/
"holidayGroupNo": "1,3,5"
/*ro, req, string, holiday group No., desc:holiday group No.*/
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/UserRightPlanTemplate/<planTemplateID>?format=json
Query Parameter
Parameter Name Parameter Type Description
planTemplateID string --
Request Message
```
{
```
```
"UserRightPlanTemplate": {
```
/*req, object, the schedule template of the access permission control*/
"enable": true,
```
/*req, bool, whether to enable, desc:true (yes), false (no)*/
```
"templateName": "test",
/*req, string, template name*/
"weekPlanNo": 1,
/*req, int, week schedule No.*/
"holidayGroupNo": "1,3,5",
/*req, string, holiday group No., desc:holiday group No.*/
"operateType": "byTerminal",
```
/*opt, enum, operation type, subType:string, desc:"byTerminal" (by terminal), "byOrg" (by organization), "byTerminalOrg" (by terminal
```
```
organization)*/
```
"terminalNoList": [1, 2, 3, 4],
/*opt, array, terminal ID list, subType:int, desc:this node is required when operation type is "byTerminal" or "byTerminalOrg"*/
"orgNoList": [1, 2, 3, 4]
/*opt, array, organization ID list, subType:int, desc:this node is required when operation type is "byOrg" or "byTerminalOrg"*/
```
}
```
```
}
```
Response Message
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": "test",
```
/*ro, opt, string, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "test",
```
/*ro, opt, string, status description, desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "test",
```
/*ro, opt, string, sub status code, desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, req, int, error code, desc:it is required when the value of statusCode is not 1, and it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, req, string, error information, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/UserRightPlanTemplate/capabilities?format=json
Query Parameter
None
Request Message
None
12.5.10.8 Set the schedule template parameters of the access permission control
12.5.10.9 Get the schedule template configuration capability of the access permission control
Hikvision co MMC
adil@hikvision.co.az
Response Message
```
{
```
```
"UserRightPlanTemplate": {
```
/*ro, opt, object*/
```
"templateNo": {
```
/*ro, opt, object, schedule template No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether it is enabled, desc:"true" (enabled), "false" (disabled)*/
```
```
"templateName": {
```
/*ro, opt, object, template name*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 32
/*ro, opt, int, the maximum value*/
```
},
```
```
"weekPlanNo": {
```
/*ro, opt, object, weekly schedule No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
},
```
```
"holidayGroupNo": {
```
/*ro, opt, object, holiday group No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/UserRightWeekPlanCfg/<weekPlanID>?format=json
Query Parameter
Parameter
Name
Parameter
Type Description
weekPlanID string Weekly schedule No., which starts from 1, and the maximum value supported by thedevice is obtained from the capability set.
Request Message
None
Response Message
12.5.10.10 Get weekly schedule configuration parameters
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"UserRightWeekPlanCfg": {
```
/*ro, req, object, weekly schedule configuration parameters*/
"enable": true,
```
/*ro, req, bool, whether to enable, desc:true (enable), false (disable)*/
```
"WeekPlanCfg": [
/*ro, req, array, weekly schedule parameters, subType:object*/
```
{
```
"week": "Monday",
/*ro, req, enum, day of the week, subType:string, desc:"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"*/
"id": 1,
/*ro, req, int, time period No., range:[1,8], desc:it is between 1 and 8*/
"enable": true,
```
/*ro, req, bool, whether to enable, desc:true (enable), false (disable)*/
```
```
"TimeSegment": {
```
/*ro, req, object, time period*/
"beginTime": "10:10:00",
/*ro, req, string, start time of the time period, desc:device local time*/
"endTime": "12:10:00"
/*ro, req, string, end time of the time period, desc:device local time*/
```
},
```
"authenticationTimesEnabled": true,
/*ro, opt, bool*/
"authenticationTimes": 10
/*ro, opt, int, range:[0,255], step:1*/
```
}
```
]
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/UserRightWeekPlanCfg/<weekPlanID>?format=json
Query Parameter
Parameter Name Parameter Type Description
weekPlanID string --
Request Message
```
{
```
```
"UserRightWeekPlanCfg": {
```
/*opt, object, the week schedule parameters of the access permission control*/
"enable": true,
```
/*req, bool, whether to enable, desc:"true" (enable), "false" (disable)*/
```
"WeekPlanCfg": [
/*req, array, week schedule parameters, subType:object*/
```
{
```
"week": "Monday",
/*req, enum, days of the week, subType:string, desc:"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"*/
"id": 1,
/*req, int, time period No., range:[1,8], desc:it is between 1 and 8*/
"enable": true,
```
/*req, bool, whether to enable, desc:"true" (enable), "false" (disable)*/
```
```
"TimeSegment": {
```
/*req, object, time period*/
"beginTime": "10:10:00",
```
/*req, string, start time of the time period, desc:(device local time)*/
```
"endTime": "12:10:00"
```
/*req, string, end time of the time period, desc:(device local time)*/
```
```
},
```
"authenticationTimesEnabled": true,
/*opt, bool*/
"authenticationTimes": 10
/*opt, int, range:[1,255], step:1*/
```
}
```
]
```
}
```
```
}
```
Response Message
12.5.10.11 Set the week schedule parameters of the access permission control
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"requestURL": "test",
/*ro, opt, string, URI*/
"statusCode": "test",
```
/*ro, opt, string, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "test",
```
/*ro, opt, string, status description, desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "test",
```
/*ro, opt, string, sub status code, desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:it is required when the value of statusCode is not 1, and it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/UserRightWeekPlanCfg/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.10.12 Get the weekly schedule configuration capability of the access permission control
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"UserRightWeekPlanCfg": {
```
/*ro, opt, object*/
```
"planNo": {
```
/*ro, opt, object, weekly schedule No.*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether it is enabled, desc:"true" (enabled), "false" (disabled)*/
```
```
"WeekPlanCfg": {
```
/*ro, opt, object, weekly schedule parameters*/
"maxSize": 56,
/*ro, opt, int, the maximum value*/
```
"week": {
```
/*ro, opt, object, week*/
"@opt": "Monday"
/*ro, opt, enum, days of the week, subType:string, desc:"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"*/
```
},
```
```
"id": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 8
/*ro, opt, int, the maximum value*/
```
},
```
"enable": "true,false",
```
/*ro, opt, string, whether it is enabled, desc:"true" (enabled), "false" (disabled)*/
```
```
"TimeSegment": {
```
/*ro, opt, object, time period*/
"beginTime": "test",
```
/*ro, opt, string, start time, desc:(device local time)*/
```
"endTime": "test",
```
/*ro, opt, string, end time, desc:(device local time)*/
```
"validUnit": "minute"
/*ro, opt, enum, time accuracy, subType:string, desc:"hour", "minute", "second". If this node is not returned, the default time accuracy is
"minute"*/
```
},
```
```
"authenticationTimesEnabled": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, req, array, subType:bool*/
```
},
```
```
"authenticationTimes": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, req, int, range:[1,255], step:1*/
"@max": 255
/*ro, req, int, range:[1,255], step:1*/
```
}
```
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/UserInfoDetail/Delete/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.11 Person and Credential Synchronized Management
```
12.5.11.1 Get the capability of deleting person information (including linked cards, fingerprints, and faces)
```
and permissions
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"UserInfoDetail": {
```
/*ro, opt, object, user Information*/
```
"mode": {
```
/*ro, req, object*/
"@opt": "all,byEmployeeNo"
```
/*ro, opt, string, deleting mode, desc:all (delete all), byEmployeeNo (delete by employee No. (person ID))*/
```
```
},
```
```
"EmployeeNoList": {
```
/*ro, opt, object, person ID list, desc:person ID list*/
"maxSize": 50,
/*ro, opt, int*/
```
"employeeNo": {
```
```
/*ro, opt, object, employee No. (person ID)*/
```
"@min": 1,
/*ro, opt, int, the maximum value*/
"@max": 32
/*ro, opt, int, the minimum value*/
```
}
```
```
}
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/UserInfoDetail/Delete?format=json
Query Parameter
None
Request Message
```
{
```
```
"UserInfoDetail": {
```
/*opt, object, user Information*/
"mode": "all",
/*req, enum, deleting mode, subType:string, desc:deleting mode*/
"EmployeeNoList": [
/*opt, array, person ID list, subType:object*/
```
{
```
"employeeNo": "test"
/*opt, string, employee No.*/
```
}
```
],
"operateType": "byTerminal",
```
/*opt, enum, operation mode, subType:string, desc:"byTerminal" (by terminal), "byOrg" (by organization), "byTerminalOrg" (by terminal
```
```
organization)*/
```
"terminalNoList": [1, 2, 3, 4],
```
/*opt, array, terminal list, subType:int, dep:and,{$.UserInfoDetail.operateType,eq,byTerminal}*/
```
"orgNoList": [1, 2, 3, 4]
```
/*opt, array, organization list, subType:int, dep:or,{$.UserInfoDetail.operateType,eq,byOrg},{$.UserInfoDetail.operateType,eq,byTerminalOrg}*/
```
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this field is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/UserInfoDetail/DeleteProcess?format=json
```
12.5.11.2 Start deleting all person information (including linked cards, fingerprints, and faces) and
```
permissions by employee No.
```
12.5.11.3 Get the status of deleting all person information (including linked cards, fingerprints, and faces)
```
and permissions by employee No
Hikvision co MMC
adil@hikvision.co.az
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"UserInfoDetailDeleteProcess": {
```
/*ro, req, object*/
"status": "processing",
/*ro, req, enum, status, subType:string, desc:status*/
"percent": 100
```
/*ro, opt, int, range:[0,100], dep:or,{$.UserInfoDetailDeleteProcess.status,eq,processing}*/
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/UserInfoDetail/Delete/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"UserInfoDetail": {
```
/*ro, opt, object, user Information*/
```
"mode": {
```
/*ro, req, object*/
"@opt": "all,byEmployeeNo"
```
/*ro, opt, string, deleting mode, desc:all (delete all), byEmployeeNo (delete by employee No. (person ID))*/
```
```
},
```
```
"EmployeeNoList": {
```
/*ro, opt, object, person ID list, desc:person ID list*/
"maxSize": 50,
/*ro, opt, int*/
```
"employeeNo": {
```
```
/*ro, opt, object, employee No. (person ID)*/
```
"@min": 1,
/*ro, opt, int, the maximum value*/
"@max": 32
/*ro, opt, int, the minimum value*/
```
}
```
```
}
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/UserInfoDetail/Delete?format=json
Query Parameter
None
Request Message
12.5.12 Person and Credential Synchronized Management
```
12.5.12.1 Get the capability of deleting person information (including linked cards, fingerprints, and faces)
```
and permissions
```
12.5.12.2 Start deleting all person information (including linked cards, fingerprints, and faces) and
```
permissions by employee No.
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"UserInfoDetail": {
```
/*opt, object, user Information*/
"mode": "all",
/*req, enum, deleting mode, subType:string, desc:deleting mode*/
"EmployeeNoList": [
/*opt, array, person ID list, subType:object*/
```
{
```
"employeeNo": "test"
/*opt, string, employee No.*/
```
}
```
],
"operateType": "byTerminal",
```
/*opt, enum, operation mode, subType:string, desc:"byTerminal" (by terminal), "byOrg" (by organization), "byTerminalOrg" (by terminal
```
```
organization)*/
```
"terminalNoList": [1, 2, 3, 4],
```
/*opt, array, terminal list, subType:int, dep:and,{$.UserInfoDetail.operateType,eq,byTerminal}*/
```
"orgNoList": [1, 2, 3, 4]
```
/*opt, array, organization list, subType:int, dep:or,{$.UserInfoDetail.operateType,eq,byOrg},{$.UserInfoDetail.operateType,eq,byTerminalOrg}*/
```
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error information, desc:this field is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/AccessControl/UserInfoDetail/DeleteProcess?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"UserInfoDetailDeleteProcess": {
```
/*ro, req, object*/
"status": "processing",
/*ro, req, enum, status, subType:string, desc:status*/
"percent": 100
```
/*ro, opt, int, range:[0,100], dep:or,{$.UserInfoDetailDeleteProcess.status,eq,processing}*/
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/UserInfo/asyncImportDatasTasks/<taskID>/status?format=json
Query Parameter
Parameter Name Parameter Type Description
taskID string --
```
12.5.12.3 Get the status of deleting all person information (including linked cards, fingerprints, and faces)
```
and permissions by employee No
12.5.13 Person and Credential Task Management
12.5.13.1 Get the status of a specified task of applying person data asynchronously
Hikvision co MMC
adil@hikvision.co.az
Request Message
None
Response Message
```
{
```
```
"AsyncImportDatasTask": {
```
/*ro, req, object*/
"taskID": "test",
/*ro, req, string, range:[1,64]*/
"URL": "test",
/*ro, opt, string, range:[1,256]*/
"status": 0,
/*ro, req, enum, subType:int*/
"totalNum": 1,
```
/*ro, opt, int, dep:and,{$.AsyncImportDatasTask.status,eq,3}*/
```
"successNum": 1,
```
/*ro, opt, int, dep:and,{$.AsyncImportDatasTask.status,eq,3}*/
```
"failedNum": 1
```
/*ro, opt, int, dep:and,{$.AsyncImportDatasTask.status,eq,3}*/
```
```
}
```
```
}
```
Request URL
DELETE /ISAPI/AccessControl/UserInfo/asyncImportDatasTasks/<taskID>?format=json
Query Parameter
Parameter Name Parameter Type Description
taskID string --
Request Message
None
Response Message
```
{
```
"statusCode": 1,
/*ro, opt, int*/
"statusString": "OK",
/*ro, opt, string, range:[1,64]*/
"subStatusCode": "ok",
/*ro, opt, string, range:[1,64]*/
"errorCode": 1,
/*ro, opt, int*/
"errorMsg": "ok",
/*ro, opt, string*/
"MErrCode": "0x00000000",
/*ro, opt, string*/
"MErrDevSelfEx": "0x00000000"
/*ro, opt, string*/
```
}
```
Request URL
GET /ISAPI/AccessControl/UserInfo/asyncImportDatasTasks/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"AsyncImportDatasCap": {
```
/*ro, req, object*/
```
"taskID": {
```
/*ro, req, object*/
"@min": 1,
12.5.13.2 Delete a specified task of applying person data asynchronously
12.5.13.3 Get the capabilities of applying person data asynchronously
Hikvision co MMC
adil@hikvision.co.az
"@min": 1,
/*ro, opt, int*/
"@max": 64
/*ro, opt, int*/
```
},
```
"taskNum": 1,
/*ro, req, int*/
```
"URL": {
```
/*ro, req, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 256
/*ro, opt, int*/
```
},
```
"singleFileMaxSize": 1,
/*ro, req, int*/
```
"employeeNo": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 32
/*ro, opt, int*/
```
},
```
```
"deleteUser": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"name": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 32
/*ro, opt, int*/
```
},
```
```
"userType": {
```
/*ro, opt, object*/
"@opt": ["normal", "visitor", "blackList"]
/*ro, opt, array, subType:string*/
```
},
```
```
"Valid": {
```
/*ro, opt, object*/
```
"enable": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
"beginTime": "1970-01-01T00:00:00+08:00",
/*ro, opt, string*/
"endTime": "2037-12-31T23:59:59+08:00"
/*ro, opt, string*/
```
},
```
```
"password": {
```
/*ro, opt, object*/
"@min": 8,
/*ro, opt, int*/
"@max": 16
/*ro, opt, int*/
```
},
```
```
"RightPlan": {
```
/*ro, opt, object*/
```
"doorNo": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"planTemplateNo": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"planTemplateNum": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
}
```
```
},
```
```
"localUIRight": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"userVerifyMode": {
```
/*ro, opt, object*/
"@opt": ["cardAndPw", "card", "cardOrPw", "fp", "fpAndPw", "fpOrCard", "fpAndCard", "fpAndCardAndPw", "faceOrFpOrCardOrPw", "faceAndFp",
"faceAndPw", "faceAndCard", "face", "employeeNoAndPw", "fpOrPw", "employeeNoAndFp", "employeeNoAndFpAndPw", "faceAndFpAndCard", "faceAndPwAndFp",
"employeeNoAndFace", "faceOrfaceAndCard", "fpOrface", "cardOrfaceOrPw", "cardOrFace", "cardOrFaceOrFp"]
/*ro, opt, array, subType:string*/
Hikvision co MMC
adil@hikvision.co.az
/*ro, opt, array, subType:string*/
```
},
```
```
"AccessControl": {
```
/*ro, opt, object*/
```
"doorRightNum": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"closeDelayEnabled": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"belongGroupNo": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"belongGroupNum": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"maxOpenDoorTime": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"openDoorTime": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"roomNumber": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"floorNumber": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
}
```
```
},
```
```
"FaceInfo": {
```
/*ro, opt, object*/
```
"deleteAllFace": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"List": {
```
/*ro, opt, object*/
"FDID": "test",
/*ro, opt, string*/
```
"faceID": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"deleteFace": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
"isSupportModelData": true
/*ro, opt, bool*/
```
}
```
```
},
```
```
"CardInfo": {
```
/*ro, opt, object*/
```
"deleteAllCard": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"List": {
```
Hikvision co MMC
adil@hikvision.co.az
/*ro, opt, object*/
```
"cardNo": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 32
/*ro, opt, int*/
```
},
```
```
"deleteCard": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"cardType": {
```
/*ro, opt, object*/
"@opt": ["normalCard", "patrolCard", "hijackCard", "superCard", "dismissingCard", "emergencyCard"]
/*ro, opt, array, subType:string*/
```
},
```
```
"AccessControl": {
```
/*ro, opt, object*/
```
"leaderCardNum": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
}
```
```
},
```
"numberPerPerson": 50
/*ro, opt, enum, subType:int*/
```
}
```
```
},
```
```
"FPInfo": {
```
/*ro, opt, object*/
```
"deleteAllFP": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"List": {
```
/*ro, opt, object*/
```
"fingerID": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 10
/*ro, opt, int*/
```
},
```
```
"deleteFP": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"enableCardReaderNo": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"enableCardReaderNum": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
},
```
```
"fingerType": {
```
/*ro, opt, object*/
"@opt": ["normalFP", "hijackFP", "patrolFP", "superFP", "dismissingFP"]
/*ro, opt, array, subType:string*/
```
},
```
```
"fingerData": {
```
/*ro, opt, object*/
"@opt": [768]
/*ro, opt, array, subType:int*/
```
},
```
```
"AccessControl": {
```
/*ro, opt, object*/
```
"leaderFPNum": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
}
```
```
}
```
```
}
```
```
}
```
```
}
```
```
}
```
Hikvision co MMC
adil@hikvision.co.az
Request URL
GET /ISAPI/AccessControl/UserInfo/asyncImportDatasTasks/status?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
"TasksStatusList": [
/*ro, req, array, subType:object*/
```
{
```
```
"AsyncImportDatasTask": {
```
/*ro, opt, object*/
"taskID": "test",
/*ro, req, string, range:[1,64]*/
"URL": "test",
/*ro, opt, string, range:[1,256]*/
"status": 0,
/*ro, req, enum, subType:int*/
"totalNum": 1,
/*ro, opt, int*/
"successNum": 1,
/*ro, opt, int*/
"failedNum": 1,
/*ro, opt, int*/
"taskMissingReason": "deviceShutDown"
```
/*ro, opt, enum, subType:string, dep:and,{$.TasksStatusList[*].AsyncImportDatasTask.status,eq,4}*/
```
```
}
```
```
}
```
]
```
}
```
Request URL
GET /ISAPI/AccessControl/UserPic/asyncImportDatasTasks/<taskID>/status?format=json
Query Parameter
Parameter Name Parameter Type Description
taskID string --
Request Message
None
Response Message
```
{
```
```
"AsyncImportDatasTask": {
```
/*ro, req, object*/
"taskID": "test",
/*ro, req, string, range:[1,64]*/
"URL": "test",
/*ro, opt, string, range:[1,256]*/
"status": 1,
/*ro, req, enum, subType:int*/
"totalNum": 1,
```
/*ro, opt, int, dep:and,{$.AsyncImportDatasTask.status,eq,2}*/
```
"successNum": 1,
```
/*ro, opt, int, dep:and,{$.AsyncImportDatasTask.status,eq,2}*/
```
"failedNum": 1
```
/*ro, opt, int, dep:and,{$.AsyncImportDatasTask.status,eq,2}*/
```
```
}
```
```
}
```
Request URL
12.5.13.4 Get the status of all tasks of applying person data asynchronously
12.5.13.5 Get the status of a specified task of applying person pictures asynchronously
12.5.13.6 Delete a specified task of applying person pictures asynchronously
Hikvision co MMC
adil@hikvision.co.az
DELETE /ISAPI/AccessControl/UserPic/asyncImportDatasTasks/<taskID>?format=json
Query Parameter
Parameter Name Parameter Type Description
taskID string --
Request Message
None
Response Message
```
{
```
"statusCode": 1,
/*ro, opt, int*/
"statusString": "OK",
/*ro, opt, string, range:[1,64]*/
"subStatusCode": "ok",
/*ro, opt, string, range:[1,64]*/
"errorCode": 1,
/*ro, opt, int*/
"errorMsg": "ok",
/*ro, opt, string*/
"MErrCode": "0x00000000",
/*ro, opt, string*/
"MErrDevSelfEx": "0x00000000"
/*ro, opt, string*/
```
}
```
Request URL
GET /ISAPI/AccessControl/UserPic/asyncImportDatasTasks/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.13.7 Get the capabilities of applying person pictures asynchronously
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"AsyncImportDatasCap": {
```
/*ro, opt, object*/
```
"taskID": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 64
/*ro, req, int*/
```
},
```
"taskNum": 1,
/*ro, req, int*/
```
"URL": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 256
/*ro, req, int*/
```
},
```
"singleFileMaxSize": 1,
/*ro, req, int*/
```
"employeeNo": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 32
/*ro, opt, int*/
```
},
```
"FDID": "test",
/*ro, opt, string*/
```
"deleteFacePic": {
```
/*ro, opt, object*/
"@opt": [true, false]
/*ro, opt, array, subType:bool*/
```
},
```
```
"picURL": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, opt, int*/
"@max": 1
/*ro, opt, int*/
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/AccessControl/UserPic/asyncImportDatasTasks/status?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
"TasksStatusList": [
/*ro, req, array, subType:object*/
```
{
```
```
"AsyncImportDatasTask": {
```
/*ro, opt, object*/
"taskID": "test",
/*ro, req, string, range:[1,64]*/
"URL": "test",
/*ro, opt, string, range:[1,256]*/
"status": 1,
/*ro, req, enum, subType:int*/
"totalNum": 1,
/*ro, opt, int*/
"successNum": 1,
/*ro, opt, int*/
"failedNum": 1
/*ro, opt, int*/
```
}
```
```
}
```
]
```
}
```
12.5.13.8 Get the status of all tasks of applying person pictures asynchronously
Hikvision co MMC
adil@hikvision.co.az
Request URL
GET /ISAPI/AccessControl/QRCodeEvent/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"QRCodeEventCap": {
```
/*ro, req, object, capability of actively getting QR code scanning events*/
```
"QRCodeEventCond": {
```
/*ro, opt, object, condition of actively getting QR code scanning events*/
```
"searchID": {
```
/*ro, req, object, search ID, desc:search ID,which is used to check whether the current search requester is the same as the previous one. If
they are the same,the search record will be stored in the device to speed up the next search*/
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 1
/*ro, opt, int, maximum value*/
```
},
```
```
"searchResultPosition": {
```
/*ro, req, object, the start position of the search result in the result list, desc:the start position of search result in the result list. In a
single search,if you cannot get all the records in the result list,you can mark the end position and get the following records after the marked position in
```
the next search. If the maximum number of totalMatches supported by the device is M and the number of totalMatches stored in the device now is N (N<=M),the
```
valid range of this node is 0 to N-1*/
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 1
/*ro, opt, int, maximum value*/
```
},
```
```
"maxResults": {
```
/*ro, req, object, the maximum number of search results that can be obtained by calling the URI this time, desc:if maxResults exceeds the range
returned by the device capability, the device will return the maximum number of search results according to the device capability and will not return error
message*/
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 1
/*ro, opt, int, maximum value*/
```
},
```
"startTime": "1970-01-01T00:00:00+08:00",
```
/*ro, opt, datetime, start time (UTC time)*/
```
"endTime": "1970-01-01T00:00:00+08:00",
```
/*ro, opt, datetime, end time (UTC time)*/
```
```
"picEnable": {
```
```
/*ro, opt, object, whether to upload the picture along with the event information, desc:false (not upload the picture along with the event
```
```
information), true (upload the picture along with the event information). false (all matched events will be uploaded without pictures) true (all matched
```
```
events will be uploaded with pictures if there are any) If this node is not configured,the default value is true*/
```
"@opt": [true, false]
/*ro, opt, array, optional, subType:bool*/
```
},
```
```
"beginSerialNo": {
```
/*ro, opt, object, start serial No.*/
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 1
/*ro, opt, int, maximum value*/
```
},
```
```
"endSerialNo": {
```
/*ro, opt, object, end serial No.*/
"@min": 1,
/*ro, opt, int, minimum value*/
"@max": 1
/*ro, opt, int, maximum value*/
```
}
```
```
},
```
```
}
```
```
}
```
Request URL
POST /ISAPI/AccessControl/QRCodeEvent?format=json
Query Parameter
12.5.14 QR Code Management
12.5.14.1 Get the capability of actively getting QR code scanning events
12.5.14.2 Search QR code scanning events
Hikvision co MMC
adil@hikvision.co.az
None
Request Message
```
{
```
```
"QRCodeEventCond": {
```
/*req, object*/
"searchID": "test",
/*req, string, search ID, desc:it is used to check whether the current search requester is the same as the previous one. If they are the same, the
search record will be stored in the device to speed up the next search*/
"searchResultPosition": 0,
/*req, int, the start position of the search result in the result list, desc:the start position of the search result in the result list*/
"maxResults": 30,
/*req, int, the maximum number of search results that can be obtained by calling the URI this time, desc:if maxResults exceeds the range returned by
the device capability, the device will return the maximum number of search results according to the device capability and will not return error message*/
"startTime": "1970-01-01T00:00:00+08:00",
```
/*opt, datetime, start time (UTC time)*/
```
"endTime": "1970-01-01T00:00:00+08:00",
```
/*opt, datetime, end time (UTC time)*/
```
"picEnable": true,
/*opt, bool, whether to upload the picture along with the event information*/
"beginSerialNo": 1,
/*opt, int, start serial No.*/
"endSerialNo": 1
/*opt, int, end serial No.*/
```
}
```
```
}
```
Response Message
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"QRCodeEvent": {
```
/*ro, req, object*/
"searchID": "test",
/*ro, req, string, search ID, desc:it is used to check whether the current search requester is the same as the previous one. If they are the same,
the search record will be stored in the device to speed up the next search*/
"responseStatusStrg": "OK",
```
/*ro, req, enum, searching status description, subType:string, desc:"OK" (searching completed), "MORE" (searching for more data), "NO MATCH" (no
```
```
matched data).*/
```
"numOfMatches": 1,
/*ro, req, int, number of results returned this time*/
"totalMatches": 1,
/*ro, req, int, total number of matched results*/
"InfoList": [
/*ro, opt, array, subType:object*/
```
{
```
"deviceName": "test",
/*ro, opt, string, device name*/
"serialNo": 1,
/*ro, opt, int, event serial No.*/
"QRCodeInfo": "test",
/*ro, req, string, QR code information*/
"thermometryUnit": "celsius",
```
/*ro, opt, enum, temperature unit, subType:string, desc:"celsius" (Celsius), "fahrenheit" (Fahrenheit), "kelvin" (Kelvin), the default value
```
is "celsius"*/
"currTemperature": 1.0,
/*ro, opt, float, face temperature, desc:it should be accurate to one decimal place*/
"isAbnomalTemperature": true,
```
/*ro, opt, bool, whether the face temperature is abnormal, desc:true (yes), false (no)*/
```
```
"RegionCoordinates": {
```
/*ro, opt, object, face temperature's coordinates*/
"positionX": 1,
/*ro, opt, int, X-coordinate, range:[0,1000], desc:the value is normalized to a number between 0 and 1000*/
"positionY": 1
/*ro, opt, int, Y-coordinate, range:[0,1000], desc:the value is normalized to a number between 0 and 1000*/
```
},
```
"mask": "unknown",
```
/*ro, opt, enum, whether the person wears a mask, subType:string, desc:"unknown" (unknown), "yes" (wearing a mask), "no" (no mask)*/
```
"visibleLightPicUrl": "test",
/*ro, opt, string, URL of the visible light picture*/
"thermalPicUrl": "test",
/*ro, opt, string, URL of the thermal picture*/
"helmet": "unknown",
/*ro, opt, enum, whether the person is wearing hard hat, subType:string, desc:"unknown", "yes", "no"*/
```
"HealthInfo": {
```
/*ro, opt, object*/
"healthCode": 1,
/*ro, opt, enum, subType:int*/
"NADCode": 1,
/*ro, opt, enum, subType:int*/
"travelCode": 1,
/*ro, opt, enum, subType:int*/
"travelInfo": "test",
/*ro, opt, string*/
"vaccineStatus": 1
/*ro, opt, enum, subType:int*/
```
},
```
"dateTime": "1970-01-01T00:00:00+08:00"
```
/*ro, req, datetime, the time (UTC time) when the alarm is triggered, desc:the maximum size is 32*/
```
```
}
```
]
```
}
```
```
}
```
```
EventType:QRCodeEvent
```
```
{
```
"ipAddress": "172.6.64.7",
/*ro, req, string, IPv4 address of the device that triggers the alarm*/
"ipv6Address": "1080:0:0:0:8:800:200C:417A",
/*ro, opt, string, IPv6 address of the device that triggers the alarm*/
"portNo": 80,
/*ro, opt, int, communication port No. of the device that triggers the alarm*/
"protocol": "HTTP",
/*ro, opt, enum, transmission communication protocol type, subType:string, desc:transmission communication protocol type: "HTTP", "HTTPS", "EHome". The
value should be "HTTP" when ISAPI protocol is transmitted via EZ protocol. The value should be "EHome" when ISAPI protocol is transmitted via ISUP*/
"macAddress": "01:17:24:45:D9:F4",
/*ro, opt, string, MAC address*/
"channelID": 1,
/*ro, opt, int, channel No. of the device that triggers the alarm, desc:when ISAPI protocol is transmitted via HCNetSDK, the channel No. is the video
channel No. of private protocol. When ISAPI protocol is transmitted via EZ protocol, the channel No. is the video channel No. of EZ protocol. When ISAPI
protocol is transmitted via ISUP, the channel No. is the video channel No. of ISUP*/
"dateTime": "2004-05-03T17:30:08+08:00",
/*ro, req, datetime, alarm trigger time*/
"activePostCount": 1,
/*ro, opt, int, times that the same alarm has been uploaded, desc:number of times that the same alarm has been uploaded*/
12.5.14.3 QR code event of access control
Hikvision co MMC
adil@hikvision.co.az
"eventType": "QRCodeEvent",
```
/*ro, req, string, event type, desc:"QRCodeEvent" (QR code event of access control)*/
```
"eventState": "active",
```
/*ro, req, enum, event status, subType:string, desc:for durative event: active (valid event or event starts), inactive (invalid event or the event
```
```
ends). For the heartbeat, the field value indicates the heartbeat data, and it is uploaded every 10 seconds*/
```
"eventDescription": "QR Code Event",
/*ro, req, string, event description, desc:event description*/
"deviceID": "test0123",
```
/*ro, opt, string, device ID (PUID), desc:it should be returned in ISUP alarm*/
```
```
"QRCodeEvent": {
```
/*ro, opt, object, QR code event of access control*/
"deviceName": "test",
/*ro, opt, string, device name*/
"serialNo": "test",
/*ro, opt, string, event serial No.*/
"currentEvent": true,
/*ro, opt, bool, whether it is a real-time event*/
"QRCodeInfo": "test",
/*ro, req, string, QR code information*/
"thermometryUnit": "celsius",
```
/*ro, opt, enum, temperature unit, subType:string, desc:"celsius" (Celsius, default value), "fahrenheit" (Fahrenheit), "kelvin" (Kelvin)*/
```
"currTemperature": 1.0,
/*ro, opt, float, face temperature, desc:it should be accurate to one decimal place*/
"isAbnomalTemperature": true,
/*ro, opt, bool, whether the face temperature is abnormal*/
```
"RegionCoordinates": {
```
/*ro, opt, object, face temperature's coordinates*/
"positionX": 1,
/*ro, opt, int, X-coordinate, range:[0,1000]*/
"positionY": 1
/*ro, opt, int, Y-coordinate, range:[0,1000]*/
```
},
```
"remoteCheck": true,
/*ro, opt, bool, whether remote verification is required, desc:it is not required by default*/
"mask": "test",
/*ro, opt, string, whether the person wears a mask*/
"visibleLightURL": "test",
/*ro, opt, string, visible light picture URL of the thermal imaging camera*/
"thermalURL": "test",
/*ro, opt, string, thermal imaging picture URL*/
"helmet": "unknown",
/*ro, opt, enum, whether the person is wearing hard hat, subType:string, desc:"unknown", "yes", "no"*/
"picturesNumber": 1,
/*ro, opt, int, number of pictures, range:[0,2], step:1*/
```
"HealthInfo": {
```
/*ro, opt, object, health information*/
"healthCode": 1,
```
/*ro, opt, enum, health code status, subType:int, desc:0 (no request), 1 (no health code), 2 (green QR code), 3 (yellow QR code), 4 (red QR
```
```
code), 5 (no such person), 6 (other error, e.g., searching failed due to API exception), 7 (searching for the health code timed out)*/
```
"NADCode": 1,
```
/*ro, opt, enum, nucleic acid test result, subType:int, desc:0 (no result), 1 (negative, which means normal), 2 (positive, which means
```
```
diagnosed), 3 (the result has expired)*/
```
"NADMsg": "test",
/*ro, opt, string, range:[0,64]*/
"travelCode": 1,
```
/*ro, opt, enum, trip code, subType:int, desc:0 (no trip in the past 14 days), 1 (once left in the past 14 days), 2 (has been to the high-risk
```
```
area in the past 14 days), 3 (other)*/
```
"travelInfo": "test",
/*ro, opt, string, trip information, desc:the empty string indicates that searching trip failed*/
"vaccineStatus": 1,
```
/*ro, opt, enum, whether the person is vaccinated, subType:int, desc:0 (not vaccinated), 1 (vaccinated)*/
```
"vaccineNum": 1,
/*ro, opt, int, step:1*/
"vaccineMsg": "test",
/*ro, opt, string, range:[0,64]*/
"ANTCode": 1,
/*ro, opt, enum, subType:int*/
"ANTMsg": "test"
/*ro, opt, string, range:[0,64]*/
```
},
```
"employeeNo": "test",
/*ro, opt, string, range:[1,32]*/
"name": "test",
/*ro, opt, string, range:[1,64]*/
"IDNum": "test"
/*ro, opt, string, range:[1,128]*/
```
}
```
```
}
```
Hikvision co MMC
adil@hikvision.co.az
Parameter
Name
Parameter
Value
```
Parameter Type(Content-
```
```
Type) Content-ID File Name Description
```
QRCodeEvent [Messagecontent] application/json -- -- --
VisibleLight [Binary picturedata] image/jpeg visibleLight_image VisibleLight.jpg --
Thermal [Binary picturedata] image/jpeg thermal_image Thermal.jpg --
Picture [Binary picturedata] image/jpeg Picture.jpg --
Note： The protocol is transmitted in form format. See Chapter 4.5.1.4 for form framework description, as shown in
the instance below.
--<frontier>
```
Content-Disposition: form-data; name=Parameter Name;filename=File Name
```
Content-Type: Parameter Type
Content-Length: ****
Content-ID: Content ID
Parameter Value
Request URL
PUT /ISAPI/AccessControl/RemoteControl/door/<doorID>
Query Parameter
Parameter Name Parameter Type Description
doorID string Door No., and 65535 represents all doors.
Request Message
```
Parameter Name: the name property of Content-Disposition in the header of form unit; it refers to the form unit
```
name.
```
Parameter Type (Content-Type): the Content-Type property in the header of form unit.
```
```
File Name (filename): the filename property of Content-Disposition of form unit Headers. It exists only when the
```
transmitted data of form unit is file, and it refers to the file name of form unit body.
Parameter Value: the body content of form unit.
12.5.15 Door Status Control
12.5.15.1 Remotely control the door or elevator
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<RemoteControlDoor xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--req, object, attr:version{req, string, protocolVersion}-->
```
<cmd>
```
<!--wo, req, enum, command, subType:string, desc:"open" (open the door), "close" (close the door (controlled)), "alwaysOpen" (remain unlocked (free)),
```
```
"alwaysClose" (remain open (disabled)), "visitorCallLadder" (call elevator (visitor)), "householdCallLadder" (call elevator (resident))-->open
```
</cmd>
<password>
<!--wo, opt, string, range:[8,16]-->test
</password>
<employeeNo>
<!--wo, opt, string, employee No., range:[0,32], desc:employee No.-->test
</employeeNo>
<channelNo>
<!--wo, opt, int, range:[0,256], step:1-->1
</channelNo>
<controlType>
<!--wo, opt, enum, subType:string-->monitor
</controlType>
<personnelChannelGroupInfoList>
<!--wo, opt, array, subType:object-->
<personnelChannelGroupInfo>
<!--wo, req, array, subType:object-->
<personnelChannelGroupID>
<!--wo, req, int, range:[1,6]-->1
</personnelChannelGroupID>
<personnelChannelInfoList>
<!--wo, opt, array, subType:object-->
<personnelChannelInfo>
<!--wo, req, object-->
<personnelChannelID>
<!--wo, req, int, range:[1,16]-->1
</personnelChannelID>
</personnelChannelInfo>
</personnelChannelInfoList>
</personnelChannelGroupInfo>
</personnelChannelGroupInfoList>
<lastOpenDoorFlag>
<!--opt, bool-->true
</lastOpenDoorFlag>
<callNumberList>
```
<!--opt, object, dep:or,{$.RemoteControlDoor.cmd,eq,open},{$.RemoteControlDoor.cmd,eq,householdCallLadder}-->
```
<callNumber>
<!--req, int-->101
</callNumber>
</callNumberList>
<callElevatorType>
```
<!--opt, enum, subType:string, dep:or,{$.RemoteControlDoor.cmd,eq,householdCallLadder}-->up
```
</callElevatorType>
<throughDoorID>
<!--opt, enum, subType:int-->1
</throughDoorID>
</RemoteControlDoor>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, opt, string, request URL, range:[0,1024]-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
<description>
<!--ro, opt, string, range:[0,1024]-->badXmlFormat
</description>
<MErrCode>
<!--ro, opt, string-->0x00000000
</MErrCode>
<MErrDevSelfEx>
<!--ro, opt, string-->0x00000000
</MErrDevSelfEx>
</ResponseStatus>
Hikvision co MMC
adil@hikvision.co.az
Request URL
GET /ISAPI/AccessControl/RemoteControl/door/capabilities
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<RemoteControlDoor xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, remote door status control, attr:version{req, float, protocolVersion}-->
```
<doorNo min="1" max="10">
```
<!--ro, opt, int, range of the door No., attr:min{req, int},max{req, int}-->1
```
</doorNo>
<cmd opt="open,close,alwaysOpen,alwaysClose,visitorCallLadder,householdCallLadder,resume">
```
<!--ro, req, enum, command, subType:string, attr:opt{req, string}, desc:"open" (open the door), "close" (close the door (controlled)), "alwaysOpen"
```
```
(remain unlocked (free)), "alwaysClose" (remain locked (disabled)), "visitorCallLadder" (call elevator (visitor)), "householdCallLadder" (call elevator
```
```
(resident))-->open
```
</cmd>
<password min="8" max="16">
```
<!--ro, opt, string, door opening password, range:[8,16], attr:min{req, int, range:[8,16]},max{req, int, range:[8,16]}-->test
```
</password>
<employeeNo min="0" max="32">
```
<!--ro, opt, string, employee No., range:[0,32], attr:min{req, int, range:[0,32]},max{req, int, range:[0,32]}-->test
```
</employeeNo>
<channelNo min="0" max="10">
```
<!--ro, opt, int, attr:min{req, int},max{req, int}-->0
```
</channelNo>
<controlType opt="monitor,calling">
```
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->monitor
```
</controlType>
</RemoteControlDoor>
Request URL
GET /ISAPI/AccessControl/remoteCheck/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.5.15.2 Get the capability set of remote door status control
12.5.16 Remote Verification
12.5.16.1 Get the remote verification capability of access control
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"RemoteCheck": {
```
/*ro, req, object*/
```
"serialNo": {
```
/*ro, opt, object, event serial No., desc:it should be the same as that in the uploaded event message*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 2000000000
/*ro, opt, int, the maximum value*/
```
},
```
```
"checkResult": {
```
/*ro, opt, object, verification result, desc:"success"-verified, "failed"-verification failed*/
"@opt": ["success", "failed"]
/*ro, opt, array, options, subType:string*/
```
},
```
```
"info": {
```
/*ro, opt, object, additional information*/
"@min": 1,
/*ro, opt, int, the minimum value*/
"@max": 32
/*ro, opt, int, the maximum value*/
```
}
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/AccessControl/remoteCheck?format=json
Query Parameter
None
Request Message
12.5.16.2 Verify the access control event remotely to control opening or closing the door
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"RemoteCheck": {
```
/*req, object*/
"serialNo": 1,
/*req, int, event serial No., desc:it should be the same as that in the uploaded event message*/
"checkResult": "success",
/*req, enum, verification result, subType:string, desc:"success"-verified, "failed"-verification failed*/
"info": "test",
/*opt, string, additional information, range:[1,1024], desc:additional information*/
"customFileID": 1,
/*opt, int, range:[1,32]*/
```
"successCustomInfo": {
```
```
/*opt, object, dep:or,{$.RemoteCheck.checkResult,eq,success}*/
```
```
"boardingGateInfo": {
```
/*opt, object*/
"flightNum": "test",
/*req, string, range:[1,32]*/
"seatNum": "25A",
/*req, string, range:[1,16]*/
"departureTime": "2020-01-01T10:00:00+08:00",
/*req, datetime*/
"departureCode": "sss",
/*req, string, range:[1,16]*/
"arrivalTime": "2020-01-01T12:00:00+08:00",
/*req, datetime*/
"arrivalCode": "sss"
/*req, string, range:[1,16]*/
```
},
```
```
"subwayInfo": {
```
/*opt, object*/
"consumeMode": "amount",
/*req, enum, subType:string*/
```
"amountInfo": {
```
```
/*opt, object, dep:and,{$.RemoteCheck.successCustomInfo.subwayInfo.consumeMode,eq,amount}*/
```
"currencyType": "USD",
/*req, enum, subType:string*/
"endTime": "2024-12-31",
/*req, date*/
"balance": "11",
/*req, string, range:[0,6]*/
"actualPayment": "1"
/*req, string, range:[0,6]*/
```
},
```
```
"countInfo": {
```
```
/*opt, object, dep:and,{$.RemoteCheck.successCustomInfo.subwayInfo.consumeMode,eq,count}*/
```
"endTime": "2024-12-31",
/*req, date*/
"remainingTimes": 9
/*req, int, range:[0,999999]*/
```
}
```
```
}
```
```
},
```
```
"userInfo": {
```
/*opt, object*/
"name": "test",
/*opt, string, range:[1,64]*/
"employeeNo": "test",
/*opt, string, range:[1,32]*/
"cardNo": "test",
/*opt, string, range:[1,32]*/
"filePathType": "URL",
/*opt, enum, subType:string*/
"filePath": "test"
/*opt, string, range:[1,10240]*/
```
}
```
```
}
```
```
}
```
Response Message
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "OK",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok",
/*ro, opt, string, error information, desc:this field is required when the value of statusCode is not 1*/
"MErrCode": "0x00000000",
/*ro, opt, string*/
"MErrDevSelfEx": "0x00000000"
/*ro, opt, string*/
```
}
```
Hikvision co MMC
adil@hikvision.co.az
Request URL
POST /ISAPI/AccessControl/CaptureFaceData
Query Parameter
None
Request Message
<?xml version="1.0" encoding="UTF-8"?>
<CaptureFaceDataCond xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--req, object, attr:version{req, string, protocolVersion}-->
```
<captureInfrared>
<!--opt, bool, whether to collect infrared face pictures simultaneously, desc:"true"-yes, "false"-no-->true
</captureInfrared>
<dataType>
```
<!--opt, enum, data type of collected face pictures, subType:string, desc:"url" (default), "binary”-->url
```
</dataType>
<readerID>
<!--opt, int, range:[1,8]-->1
</readerID>
</CaptureFaceDataCond>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<CaptureFaceData xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, attr:version{req, string, protocolVersion}-->
```
<CaptureFaceDataCond>
<!--ro, opt, object-->
<captureInfrared opt="true,false">
```
<!--ro, opt, bool, attr:opt{req, string}-->true
```
</captureInfrared>
<dataType opt="url,binary">
```
<!--ro, opt, enum, subType:string, attr:opt{req, string}-->url
```
</dataType>
</CaptureFaceDataCond>
<faceDataUrl min="1" max="768">
```
<!--ro, opt, string, face data URL, if this node does not exist, it indicates that there is no face data, attr:min{req, int},max{req, int}-->test
```
</faceDataUrl>
<captureProgress min="1" max="10">
```
<!--ro, opt, int, collection progress, range:[0,100], attr:min{req, int},max{req, int}-->1
```
</captureProgress>
<infraredFaceDataUrl min="1" max="100">
```
<!--ro, opt, string, infrared face data URL, if this node does not exist, it indicates that there is no infrared face data, attr:min{req, int},max{req,
```
```
int}-->test
```
</infraredFaceDataUrl>
<modelData>
<!--ro, opt, string-->test
</modelData>
<score>
```
<!--ro, opt, int, face score (face picture quality), range:[0,100]-->0
```
</score>
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
12.6 Credentials Collection
12.6.1 Face Picture Collecting
12.6.1.1 Collect face picture information
Hikvision co MMC
adil@hikvision.co.az
Parameter
Name
Parameter
Value
```
Parameter Type(Content-
```
```
Type)
```
Content-
ID File Name Description
CaptureFace [Messagecontent] application/xml -- -- --
FaceData [Binary picturedata] image/jpeg FaceDatac --
InfraredFaceData [Binary picturedata] image/jpeg InfraredFaceData.jpg --
faceMatting [Binary picturedata] image/jpeg faceMatting.jpg --
Note： The protocol is transmitted in form format. See Chapter 4.5.1.4 for form framework description, as shown in
the instance below.
--<frontier>
```
Content-Disposition: form-data; name=Parameter Name;filename=File Name
```
Content-Type: Parameter Type
Content-Length: ****
Content-ID: Content ID
Parameter Value
Request URL
GET /ISAPI/AccessControl/CaptureFaceData/capabilities
Query Parameter
None
Request Message
None
Response Message
```
Parameter Name: the name property of Content-Disposition in the header of form unit; it refers to the form unit
```
name.
```
Parameter Type (Content-Type): the Content-Type property in the header of form unit.
```
```
File Name (filename): the filename property of Content-Disposition of form unit Headers. It exists only when the
```
transmitted data of form unit is file, and it refers to the file name of form unit body.
Parameter Value: the body content of form unit.
12.6.1.2 Get the capability of collecting face picture information.
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<CaptureFaceData xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, capability of collecting face picture information, attr:version{req, string, protocolVersion}-->
```
<CaptureFaceDataCond>
<!--ro, req, bool, whether to collect the infrared face data-->true
<captureInfrared opt="true,false">
```
<!--ro, opt, bool, whether to collect the infrared face data, attr:opt{req, string}-->true
```
</captureInfrared>
<dataType opt="url,binary">
```
<!--ro, opt, enum, data type of collected face pictures, subType:string, attr:opt{req, string}, desc:url (URL, default),binary (binary)-->url
```
</dataType>
</CaptureFaceDataCond>
<faceDataUrl min="1" max="768">
```
<!--ro, opt, string, face data URL, range:[1,768], attr:min{req, int},max{req, int}-->1
```
</faceDataUrl>
<captureProgress min="1" max="10">
```
<!--ro, req, int, collection progress, range:[1,10], attr:min{req, int},max{req, int}-->1
```
</captureProgress>
<infraredFaceDataUrl min="1" max="100">
```
<!--ro, req, string, infrared picture URL, range:[1,100], attr:min{req, int},max{req, int}-->test
```
</infraredFaceDataUrl>
<modelData min="1" max="10">
```
<!--ro, opt, string, face modeling data encoded by Base64, attr:min{req, int},max{req, int}-->test
```
</modelData>
<score min="0" max="100">
```
<!--ro, opt, int, face score, range:[0,100], attr:min{req, int},max{req, int}-->80
```
</score>
<thermometryUnit opt="celsius,fahrenheit,kelvin">
```
<!--ro, opt, string, temperature unit: celsius (Celsius, default), attr:opt{req, string}-->test
```
</thermometryUnit>
<currTemperature min="0" max="10">
```
<!--ro, opt, float, face temperature which is accurate to one decimal place, attr:min{req, int},max{req, int}-->0.000
```
</currTemperature>
<visibleLightURL min="0" max="10">
```
<!--ro, opt, string, URL of the visible light picture captured by the thermal camera, attr:min{req, int},max{req, int}-->test
```
</visibleLightURL>
<thermalURL min="0" max="10">
```
<!--ro, opt, string, thermal picture URL, attr:min{req, int},max{req, int}-->test
```
</thermalURL>
<readerID min="1" max="8">
```
<!--ro, opt, int, range:[1,8], attr:min{req, int},max{req, int}-->1
```
</readerID>
</CaptureFaceData>
Request URL
GET /ISAPI/AccessControl/CaptureFaceData/Progress/capabilities
Query Parameter
None
Request Message
None
Response Message
12.6.1.3 Get capability of getting face picture collection progress
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<CaptureFaceData xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, attr:version{req, string, protocolVersion}-->
```
<faceDataUrl min="0" max="10">
```
<!--ro, opt, string, face data URL, range:[1,32], attr:min{req, int},max{req, int}, desc:face data URL,if this node does not exist,it indicates that
```
there is no face data-->test
</faceDataUrl>
<captureProgress min="0" max="100">
```
<!--ro, req, int, collection progress, range:[0,100], attr:min{req, int},max{req, int}, desc:collection progress,which is between 0 and 100,0-no face
```
data collected,100-collected,the face data URL can be parsed only when the progress is 100-->1
</captureProgress>
<isCurRequestOver opt="true,false">
```
<!--ro, opt, bool, whether the current collection request is completed, attr:opt{req, string}-->true
```
</isCurRequestOver>
<infraredFaceDataUrl min="0" max="10">
```
<!--ro, opt, string, infrared face data URL, range:[1,32], attr:min{req, int},max{req, int}, desc:if this node does not exist, it indicates that there
```
is no infrared face data-->test
</infraredFaceDataUrl>
<readerID min="1" max="8">
```
<!--ro, opt, int, range:[1,8], attr:min{req, int},max{req, int}-->1
```
</readerID>
<requireReaderID>
<!--ro, opt, bool-->true
</requireReaderID>
</CaptureFaceData>
Request URL
GET /ISAPI/AccessControl/CaptureFaceData/Progress?readerID=<readerID>
Query Parameter
Parameter Name Parameter Type Description
readerID string The intelligent host supports capturing faces by card reader.
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<CaptureFaceData xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, attr:version{req, string, protocolVersion}-->
```
<faceDataUrl>
<!--ro, opt, string, face data URL, range:[1,32]-->test
</faceDataUrl>
<captureProgress>
<!--ro, req, int, collection progress, range:[0,100], desc:collection progress,which is between 0 and 100,0-no face data collected,100-collected,the
face data URL can be parsed only when the progress is 100-->100
</captureProgress>
<isCurRequestOver>
<!--ro, opt, bool, whether the current collection request is completed, desc:whether the current collection request is completed: "true"-yes,"false"-no-
->true
</isCurRequestOver>
<infraredFaceDataUrl>
<!--ro, opt, string, infrared face data URL, range:[1,32], desc:if this node does not exist, it indicates that there is no infrared face data-->test
</infraredFaceDataUrl>
<faceMattingURL>
<!--ro, opt, string, range:[1,32]-->test
</faceMattingURL>
</CaptureFaceData>
Request URL
POST /ISAPI/AccessControl/CaptureFingerPrint
Query Parameter
None
12.6.1.4 Get the progress of collecting face picture information
12.6.2 Fingerprint Online Collection
12.6.2.1 Collect fingerprint information
Hikvision co MMC
adil@hikvision.co.az
Request Message
<?xml version="1.0" encoding="UTF-8"?>
<CaptureFingerPrintCond xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--opt, object, Collect fingerprint information conditions, attr:version{req, string, protocolVersion}-->
```
<fingerNo>
<!--req, int, finger No., range:[1,10]-->1
</fingerNo>
</CaptureFingerPrintCond>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<CaptureFingerPrint xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, attr:version{req, string, protocolVersion}-->
```
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
```
Parameter Name Parameter Value Parameter Type(Content-Type)Content-ID File Name Description
```
CaptureFingerPrint [Message content] application/xml -- -- --
fingerPrintPic [Binary picturedata] image/jpeg fingerPrintPic.jpg --
Note： The protocol is transmitted in form format. See Chapter 4.5.1.4 for form framework description, as shown in
the instance below.
--<frontier>
```
Content-Disposition: form-data; name=Parameter Name;filename=File Name
```
Content-Type: Parameter Type
Content-Length: ****
Content-ID: Content ID
Parameter Value
Request URL
GET /ISAPI/AccessControl/CaptureFingerPrint/capabilities
Query Parameter
None
Request Message
None
Response Message
```
Parameter Name: the name property of Content-Disposition in the header of form unit; it refers to the form unit
```
name.
```
Parameter Type (Content-Type): the Content-Type property in the header of form unit.
```
```
File Name (filename): the filename property of Content-Disposition of form unit Headers. It exists only when the
```
transmitted data of form unit is file, and it refers to the file name of form unit body.
Parameter Value: the body content of form unit.
12.6.2.2 Get the fingerprint collection capability
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<CaptureFingerPrint xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, collect fingerprint information, attr:version{req, string, protocolVersion}-->
```
<CaptureFingerPrintCond>
<!--ro, req, object, finger No.-->
<fingerNo min="1" max="10">
```
<!--ro, opt, int, fingerprint No., range:[1,10], attr:min{req, int},max{req, int}-->1
```
</fingerNo>
</CaptureFingerPrintCond>
<fingerData min="1" max="768">
```
<!--ro, opt, string, fingerprint data, range:[1,768], attr:min{req, int},max{req, int}-->test
```
</fingerData>
<fingerNo min="1" max="10">
```
<!--ro, opt, int, fingerprint No., range:[1,10], attr:min{req, int},max{req, int}-->1
```
</fingerNo>
<fingerPrintQuality min="1" max="100">
```
<!--ro, opt, int, fingerprint quality, range:[1,100], attr:min{req, int},max{req, int}-->1
```
</fingerPrintQuality>
</CaptureFingerPrint>
Request URL
GET /ISAPI/VideoIntercom/Elevators/<elevatorID>/ControlCfg/capabilities?format=json
Query Parameter
Parameter Name Parameter Type Description
elevatorID string --
Request Message
None
Response Message
```
{
```
```
"ElevatorControlCfg": {
```
/*ro, req, object*/
```
"elevatorNo": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, req, int*/
"@max": 8
/*ro, req, int*/
```
},
```
```
"enable": {
```
/*ro, opt, object*/
"@opt": "true,false"
/*ro, req, string*/
```
},
```
```
"numOfNegFloors": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, req, int*/
"@max": 10
/*ro, req, int*/
```
},
```
```
"interfaceType": {
```
/*ro, opt, object*/
"@opt": [1, 2]
/*ro, req, array, subType:int*/
```
},
```
```
"protocolType": {
```
/*ro, opt, object*/
"@opt": ["private", "ISAPI"]
/*ro, req, array, subType:string*/
```
},
```
```
"transportProtocol": {
```
/*ro, opt, object*/
"@opt": ["HTTP", "HTTPS"]
/*ro, req, array, subType:string*/
```
},
```
```
"deviceType": {
```
/*ro, opt, object*/
"@opt": ["DS-K2201", "DS-K2210", "DS-K2220", "custom"]
12.7 Elevator Control
12.7.1 Elevator Control Parameter Management
12.7.1.1 Get the capability of elevator control parameters
Hikvision co MMC
adil@hikvision.co.az
"@opt": ["DS-K2201", "DS-K2210", "DS-K2220", "custom"]
/*ro, req, array, subType:string*/
```
},
```
```
"ServerAddress": {
```
/*ro, opt, object*/
```
"addressingFormatType": {
```
/*ro, opt, object*/
"@opt": ["ipaddress", "hostname"]
/*ro, req, array, subType:string*/
```
},
```
```
"hostName": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, req, int*/
"@max": 128
/*ro, req, int*/
```
},
```
```
"ipAddress": {
```
/*ro, opt, object*/
"@min": 7,
/*ro, req, int*/
"@max": 15
/*ro, req, int*/
```
},
```
```
"ipv6Address": {
```
/*ro, opt, object*/
"@min": 15,
/*ro, req, int*/
"@max": 39
/*ro, req, int*/
```
}
```
```
},
```
```
"serverPort": {
```
/*ro, opt, object*/
"@min": 0,
/*ro, req, int*/
"@max": 65535
/*ro, req, int*/
```
},
```
```
"userName": {
```
/*ro, opt, object*/
"@min": 1,
/*ro, req, int*/
"@max": 64
/*ro, req, int*/
```
},
```
```
"password": {
```
/*ro, opt, object*/
"@min": 8,
/*ro, req, int*/
"@max": 16
/*ro, req, int*/
```
},
```
```
"isSupportRS485": {
```
/*ro, opt, object*/
"@opt": ["DS-K2201", "DS-K2210", "DS-K2220", "custom"]
/*ro, req, array, subType:string*/
```
},
```
```
"isSupportNetWork": {
```
/*ro, opt, object*/
"@opt": ["DS-K2201", "DS-K2210", "DS-K2220", "custom"]
/*ro, req, array, subType:string*/
```
},
```
```
"isSupportNegativeFloor": {
```
/*ro, opt, object*/
"@opt": ["DS-K2201", "DS-K2210", "DS-K2220", "custom"]
/*ro, req, array, subType:string*/
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/VideoIntercom/Elevators/<elevatorID>/ControlCfg?format=json
Query Parameter
Parameter Name Parameter Type Description
elevatorID string It starts from 1.
Request Message
None
Response Message
12.7.1.2 Get the elevator control parameters
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"ElevatorControlCfg": {
```
/*ro, req, object*/
"enable": true,
/*ro, opt, bool*/
"numOfNegFloors": 1,
/*ro, opt, int*/
"interfaceType": 1,
/*ro, opt, enum, subType:int*/
"protocolType": "ISAPI",
```
/*ro, opt, enum, subType:string, dep:or,{$.ElevatorControlCfg.interfaceType,eq,2}*/
```
"transportProtocol": "HTTP",
```
/*ro, opt, enum, subType:string, dep:or,{$.ElevatorControlCfg.protocolType,eq,ISAPI}*/
```
"deviceType": "DS-K2201",
/*ro, opt, enum, subType:string*/
```
"ServerAddress": {
```
```
/*ro, opt, object, dep:and,{$.ElevatorControlCfg.interfaceType,eq,2}*/
```
"addressingFormatType": "ipaddress",
/*ro, req, enum, subType:string*/
"hostName": "test",
```
/*ro, opt, string, dep:and,{$.ElevatorControlCfg.ServerAddress.addressingFormatType,eq,hostname}*/
```
"ipAddress": "test",
```
/*ro, opt, string, dep:and,{$.ElevatorControlCfg.ServerAddress.ipAddress,eq,ipaddress}*/
```
"ipv6Address": "test"
```
/*ro, opt, string, dep:or,{$.ElevatorControlCfg.ServerAddress.addressingFormatType,eq,ipaddress}*/
```
```
},
```
"serverPort": 0,
```
/*ro, opt, int, dep:and,{$.ElevatorControlCfg.interfaceType,eq,2}*/
```
"userName": "test",
```
/*ro, opt, string, dep:and,{$.ElevatorControlCfg.interfaceType,eq,2}*/
```
"password": "test"
```
/*ro, opt, string, dep:and,{$.ElevatorControlCfg.interfaceType,eq,2}*/
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/VideoIntercom/Elevators/<elevatorID>/ControlCfg?format=json
Query Parameter
Parameter Name Parameter Type Description
elevatorID string --
Request Message
```
{
```
```
"ElevatorControlCfg": {
```
/*opt, object*/
"enable": "true",
/*opt, string*/
"numOfNegFloors": 1,
/*opt, int*/
"interfaceType": 1,
/*opt, enum, subType:int*/
"deviceType": "DS-K2201",
/*opt, enum, subType:string*/
```
"ServerAddress": {
```
/*opt, object*/
"addressingFormatType": "ipaddress",
/*req, enum, subType:string*/
"hostName": "test",
/*opt, string*/
"ipAddress": "test",
/*opt, string*/
"ipv6Address": "test"
/*opt, string*/
```
},
```
"serverPort": 0,
/*opt, int*/
"userName": "test",
/*opt, string*/
"password": "test"
/*opt, string*/
```
}
```
```
}
```
Response Message
12.7.1.3 Set the elevator control parameters
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"statusCode": 1,
/*ro, opt, int*/
"statusString": "ok",
/*ro, opt, string, range:[1,64]*/
"subStatusCode": "ok",
/*ro, opt, string, range:[1,64]*/
"errorCode": 1,
/*ro, opt, int*/
"errorMsg": "ok"
/*ro, opt, string*/
```
}
```
Request URL
GET /ISAPI/VideoIntercom/callElevator/capabilities
Query Parameter
None
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<CallElevatorCfg xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, attr:version{req, string, protocolVersion}-->
```
<floorNumber min="0" max="999">
```
<!--ro, req, int, attr:min{req, int},max{req, int}-->0
```
</floorNumber>
<authorizedFloorList size="10">
```
<!--ro, req, object, attr:size{req, int}-->
```
<number min="0" max="999">
```
<!--ro, req, int, attr:min{req, int},max{req, int}-->0
```
</number>
</authorizedFloorList>
</CallElevatorCfg>
Request URL
GET /ISAPI/VideoIntercom/callerInfo/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
12.7.2 Remote Elevator Control
12.7.2.1 Get the capability of elevator remote calling
```
12.8 Video Intercom (General)
```
12.8.1 Video Intercom Call Service
12.8.1.1 Get the capability of getting the caller information
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"CallerInfo": {
```
/*ro, req, object*/
```
"buildingNo": {
```
/*ro, opt, object, building No.*/
"@min": 0,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
},
```
```
"floorNo": {
```
/*ro, opt, object, floor No.*/
"@min": 0,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
},
```
```
"zoneNo": {
```
/*ro, opt, object, project No.*/
"@min": 0,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
},
```
```
"unitNo": {
```
/*ro, opt, object, unit No.*/
"@min": 0,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
},
```
```
"devNo": {
```
/*ro, opt, object, device No.*/
"@min": 0,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
},
```
```
"devType": {
```
/*ro, req, object, device type, desc:1-door station, 2-main station, 3-indoor station, 4-outer door station, 5-villa door station, 6-doorphone, 7-
Infosight Client Software, 8-iVMS-4200 Client Software, 9-APP, 10-doorbell, 11-VOIP Client Software, 12-network camera, 13-access control device*/
"@opt": "1,2,3,4,5,6,7,8,9,10,11,12,13,14"
/*ro, opt, string, options*/
```
},
```
```
"lockNum": {
```
/*ro, opt, object, number of locks*/
"@min": 0,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
},
```
```
"voipNo": {
```
/*ro, opt, object, VOIP Client Software number, desc:this node is valid when devType is 11*/
"@min": 0,
/*ro, opt, int, the minimum value*/
"@max": 16
/*ro, opt, int, the maximum value*/
```
},
```
```
"status": {
```
/*ro, req, object, status, desc:"idle", "ring", "onCall"-the call is in progress*/
"@opt": "idle,ring,onCall"
/*ro, opt, string*/
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/VideoIntercom/callerInfo?format=json
Query Parameter
None
Request Message
None
Response Message
12.8.1.2 Get the caller information
Hikvision co MMC
adil@hikvision.co.az
```
{
```
```
"CallerInfo": {
```
/*ro, req, object*/
"buildingNo": 1,
/*ro, opt, int, building No., range:[0,16]*/
"floorNo": 1,
/*ro, opt, int, floor No., range:[0,16]*/
"zoneNo": 1,
/*ro, opt, int, project No., range:[0,16]*/
"unitNo": 1,
/*ro, opt, int, unit No., range:[0,16]*/
"devNo": 1,
/*ro, opt, int, device No., range:[0,16]*/
"devType": 1,
/*ro, req, int, device type, desc:1-door station, 2-main station, 3-indoor station, 4-outer door station, 5-villa door station, 6-doorphone, 7-
Infosight Client Software, 8-iVMS-4200 Client Software, 9-APP, 10-doorbell, 11-VOIP Client Software, 12-network camera, 13-access control device*/
"lockNum": 1,
/*ro, opt, int, number of locks, range:[0,16]*/
"voipNo": "test",
/*ro, opt, string, VOIP Client Software number, desc:this node is valid when devType is 11*/
"status": "idle"
/*ro, req, string, status, desc:"idle", "ring", "onCall"-the call is in progress*/
```
}
```
```
}
```
Request URL
GET /ISAPI/VideoIntercom/callSignal/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"CallSignal": {
```
/*ro, req, object*/
```
"cmdType": {
```
/*ro, req, object, signaling type*/
"@opt": ["request", "cancel", "answer", "reject", "bellTimeout", "hangUp", "deviceOnCall"]
/*ro, req, array, range, subType:string, range:[0,7], desc:"request" request for call, "cancel"-cancel the call, "answer"-answer the call,
"reject"-reject the call, "bellTimeout"-callee ringing timed out, "hangUp"-end call, "deviceOnCall"-the device is busy*/
```
},
```
```
"industryType": {
```
/*ro, opt, object*/
"@opt": ["builidings", "prison", "medicalTreatment", "broadcasting"]
/*ro, req, array, range, subType:string, range:[0,4]*/
```
},
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/VideoIntercom/callSignal?format=json
Query Parameter
None
Request Message
```
{
```
```
"CallSignal": {
```
/*req, object, call signaling interaction parameters*/
"cmdType": "request",
/*req, enum, operation type, subType:string, desc:operation type: "request","cancel","answer","reject","bellTimeout","hangUp","deviceOnCall"*/
"sessionId": "test",
/*opt, string*/
```
"src": {
```
/*opt, object*/
"periodNumber": 1,
/*opt, int, community number*/
"buildingNumber": 1,
/*opt, int, building number*/
12.8.1.3 Get the capability of the call signaling interaction
12.8.1.4 Set the call signaling interaction parameters
Hikvision co MMC
adil@hikvision.co.az
/*opt, int, building number*/
"unitNumber": 1,
/*opt, int, unit number*/
"floorNumber": 1,
/*opt, int, floor No.*/
"roomNumber": 1,
/*opt, int, room No.*/
"devIndex": 1,
/*opt, int, device No.*/
"communityNumber": "test",
/*opt, string, community No.*/
"callNumber": "12312312311",
/*opt, string, range:[1,11]*/
"unitType": "indoor",
```
/*opt, enum, type, subType:string, desc:device type: "indoor"-indoor station,"villa"-door station (V series),"confirm"-doorphone,"outdoor"-door
```
station,"fence"-outer door station,"doorbell"-doorbell,"manage"-main station,"acs"-access control device*/
"personUUID": "test",
/*opt, string*/
"personType": "student",
/*opt, enum, person type, subType:string*/
"industryType": "builidings",
/*opt, enum, industry type, subType:string*/
"callType": "voice",
/*opt, enum, subType:string*/
"model": "DS-KD9403-A",
/*opt, string, device model, range:[1,64]*/
"serialNumber": "test"
/*opt, string, device serial No., range:[9,48]*/
```
},
```
```
"target": {
```
/*opt, object, target information*/
"periodNumber": 1,
/*opt, int, community number*/
"buildingNumber": 1,
/*opt, int, building number*/
"unitNumber": 1,
/*opt, int, unit number*/
"floorNumber": 1,
/*opt, int, floor No.*/
"roomNumber": 1,
/*opt, int, room No.*/
"devIndex": 1,
/*opt, int, device No.*/
"communityNumber": "test",
/*opt, string, community No.*/
"callNumber": "12312312311",
/*opt, string, range:[1,11]*/
"unitType": "indoor",
```
/*opt, enum, type, subType:string, desc:device type: "indoor"-indoor station,"villa"-door station (V series),"confirm"-doorphone,"outdoor"-door
```
station,"fence"-outer door station,"doorbell"-doorbell,"manage"-main station,"acs"-access control device*/
"personUUID": "test",
/*opt, string*/
"personType": "student",
/*opt, enum, person type, subType:string*/
"industryType": "builidings",
/*opt, enum, industry type, subType:string*/
"callType": "voice",
/*opt, enum, subType:string*/
"callWaitingDelayTime": 10,
/*opt, int, range:[10,60], unit:s*/
"serialNumber": "test"
/*opt, string, device serial No., range:[9,48]*/
```
},
```
```
"CallInfo": {
```
/*opt, object, call information*/
"STSPort": 7000,
/*opt, int*/
"STSIpV4Address": "test",
/*opt, string*/
"clientID": "test",
/*opt, string, client ID, range:[1,32]*/
"VCPort": 7000,
/*opt, int*/
"VCIpV4Address": "test",
/*opt, string*/
"roomID": 1,
/*opt, int, room No.*/
"password": "test",
/*opt, string, password, range:[8,16]*/
"conferenceMaxCount": 2
/*opt, int*/
```
},
```
"messageID": "test",
/*opt, string, range:[1,64]*/
"exceptionInfo": "test"
/*opt, string, range:[1,128]*/
```
}
```
```
}
```
Response Message
Hikvision co MMC
adil@hikvision.co.az
```
{
```
"statusCode": 1,
```
/*ro, opt, int, status code, desc:1 (succeeded). It is required when an error occurred*/
```
"statusString": "ok",
```
/*ro, opt, string, status description, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"subStatusCode": "ok",
```
/*ro, opt, string, sub status code, range:[1,64], desc:"ok" (succeeded). It is required when an error occurred*/
```
"errorCode": 1,
/*ro, opt, int, error code, desc:when the value of statusCode is not 1, it corresponds to subStatusCode*/
"errorMsg": "ok"
/*ro, opt, string, error description, desc:this node is required when the value of statusCode is not 1*/
```
}
```
Request URL
GET /ISAPI/VideoIntercom/callStatus/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"CallStatus": {
```
/*ro, opt, object, call status*/
```
"status": {
```
/*ro, req, object, status*/
"@opt": ["idle", "ring", "onCall"]
/*ro, req, array, options, subType:string*/
```
}
```
```
}
```
```
}
```
Request URL
GET /ISAPI/VideoIntercom/callStatus?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"CallStatus": {
```
/*ro, opt, object, call status*/
"status": "idle"
```
/*ro, req, enum, status, subType:string, desc:"idle", "ring" (ringing), "onCall" (busy)*/
```
```
}
```
```
}
```
Request URL
PUT /ISAPI/VideoIntercom/relatedDeviceAddress
Query Parameter
None
Request Message
12.8.1.5 Get the capability of getting the call status
12.8.1.6 Get the call status
12.8.2 Linked Device Management
```
12.8.2.1 Set the linked device address (linked network)
```
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<RelatedDeviceAddress xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--opt, object, attr:version{req, string, protocolVersion}-->
```
<unitType>
<!--opt, enum, device type, subType:string, desc:device type-->outdoor
</unitType>
<MainOutdoorAddress>
<!--opt, object, address of main door station-->
<addressingFormatType>
<!--req, enum, address type, subType:string, desc:"ipaddress", "hostname"-->ipaddress
</addressingFormatType>
<hostName>
<!--opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</MainOutdoorAddress>
<SIPServerAddress>
<!--opt, object, SIP server address-->
<addressingFormatType>
<!--req, enum, address type, subType:string, desc:"ipaddress", "hostname"-->ipaddress
</addressingFormatType>
<hostName>
<!--opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</SIPServerAddress>
<centerPort>
<!--opt, int, port No. of center platform, range:[0,65535]-->1
</centerPort>
<CenterAddress>
<!--opt, object, center platform address-->
<addressingFormatType>
<!--req, enum, address type, subType:string, desc:"ipaddress", "hostname"-->ipaddress
</addressingFormatType>
<hostName>
<!--opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</CenterAddress>
<MainRoomAddress>
<!--opt, object, IP address of indoor station-->
<addressingFormatType>
<!--req, enum, address type, subType:string, desc:"ipaddress", "hostname"-->ipaddress
</addressingFormatType>
<hostName>
<!--opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</MainRoomAddress>
<ManageAddress>
<!--opt, object, IP address of the main station-->
<addressingFormatType>
<!--req, enum, address type, subType:string, desc:"ipaddress", "hostname"-->ipaddress
</addressingFormatType>
<hostName>
<!--opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</ManageAddress>
</RelatedDeviceAddress>
Response Message
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status description, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, error code description, desc:error code description-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/VideoIntercom/relatedDeviceAddress
Query Parameter
None
Request Message
None
Response Message
```
12.8.2.2 Get the linked device address (linked network)
```
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<RelatedDeviceAddress xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, attr:version{req, string, protocolVersion}-->
```
<unitType>
<!--ro, opt, enum, device type, subType:string, desc:device type-->outdoor
</unitType>
<MainOutdoorAddress>
<!--ro, opt, object, address of main door station-->
<addressingFormatType>
<!--ro, req, enum, address type, subType:string, desc:"ipaddress", "hostname"-->ipaddress
</addressingFormatType>
<hostName>
<!--ro, opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--ro, opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</MainOutdoorAddress>
<SIPServerAddress>
<!--ro, opt, object, SIP server address-->
<addressingFormatType>
<!--ro, req, enum, address type, subType:string, desc:"ipaddress", "hostname"-->ipaddress
</addressingFormatType>
<hostName>
<!--ro, opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--ro, opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</SIPServerAddress>
<centerPort>
<!--ro, opt, int, port No. of center platform, range:[0,65535]-->1
</centerPort>
<CenterAddress>
<!--ro, opt, object, center platform address-->
<addressingFormatType>
<!--ro, req, enum, address type, subType:string, desc:"ipaddress", "hostname"-->ipaddress
</addressingFormatType>
<hostName>
<!--ro, opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--ro, opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</CenterAddress>
<MainRoomAddress>
<!--ro, opt, object, IP address of indoor station-->
<addressingFormatType>
<!--ro, req, enum, address type, subType:string, desc:"ipaddress", "hostname"-->ipaddress
</addressingFormatType>
<hostName>
<!--ro, opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--ro, opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</MainRoomAddress>
<ManageAddress>
<!--ro, opt, object, IP address of the main station-->
<addressingFormatType>
<!--ro, req, enum, address type, subType:string, desc:"ipaddress", "hostname"-->ipaddress
</addressingFormatType>
<hostName>
<!--ro, opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--ro, opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</ManageAddress>
</RelatedDeviceAddress>
```
12.8.2.3 Get the configuration capability of the linked device address (linked network)
```
Hikvision co MMC
adil@hikvision.co.az
Request URL
GET /ISAPI/VideoIntercom/relatedDeviceAddress/capabilities
Query Parameter
None
Request Message
None
Response Message
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<RelatedDeviceAddress xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, opt, object, attr:version{req, string, protocolVersion}-->
```
<unitType opt="outdoor,fence ">
```
<!--ro, opt, enum, device type, subType:string, attr:opt{req, string}, desc:device type-->outdoor
```
</unitType>
<MainOutdoorAddress>
<!--ro, opt, object, address of main door station-->
<addressingFormatType opt="ipaddress,hostname">
```
<!--ro, req, enum, address type, subType:string, attr:opt{req, string}, desc:"ipaddress", "hostname"-->ipaddress
```
</addressingFormatType>
<hostName>
<!--ro, opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--ro, opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</MainOutdoorAddress>
<SIPServerAddress>
<!--ro, opt, object, SIP server address-->
<addressingFormatType opt="ipaddress,hostname">
```
<!--ro, req, enum, address type, subType:string, attr:opt{req, string}, desc:"ipaddress", "hostname"-->ipaddress
```
</addressingFormatType>
<hostName>
<!--ro, opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--ro, opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</SIPServerAddress>
<centerPort>
<!--ro, opt, int, port No. of center platform, range:[0,65535]-->0
</centerPort>
<CenterAddress>
<!--ro, opt, object, center platform address-->
<addressingFormatType opt="ipaddress,hostname">
```
<!--ro, req, enum, address type, subType:string, attr:opt{req, string}, desc:"ipaddress", "hostname"-->ipaddress
```
</addressingFormatType>
<hostName>
<!--ro, opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--ro, opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</CenterAddress>
<MainRoomAddress>
<!--ro, opt, object, IP address of indoor station-->
<addressingFormatType opt="ipaddress,hostname">
```
<!--ro, req, enum, address type, subType:string, attr:opt{req, string}, desc:"ipaddress", "hostname"-->ipaddress
```
</addressingFormatType>
<hostName>
<!--ro, opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--ro, opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</MainRoomAddress>
<ManageAddress>
<!--ro, opt, object, IP address of main station-->
<addressingFormatType opt="ipaddress,hostname">
```
<!--ro, req, enum, address type, subType:string, attr:opt{req, string}, desc:"ipaddress", "hostname"-->ipaddress
```
</addressingFormatType>
<hostName>
<!--ro, opt, string, host domain name, range:[0,128]-->test
</hostName>
<ipAddress>
<!--ro, opt, string, IPv4 address, range:[0,128]-->255.255.255.255
</ipAddress>
<ipv6Address>
<!--ro, opt, string, IPv6 address, range:[0,128]-->ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
</ipv6Address>
</ManageAddress>
</RelatedDeviceAddress>
12.8.3 Sub-module Management
Hikvision co MMC
adil@hikvision.co.az
Request URL
GET /ISAPI/VideoIntercom/keyCfg/<keyID>/capabilities?moduleId=<subModuleID>
Query Parameter
Parameter
Name
Parameter
Type Description
keyID string --
subModuleID string The sub-module ID corresponds to that obtained by sub-module list. If this parameter isnot included, configure the main module.
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<KeyCfg xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, button No., attr:version{req, string, protocolVersion}-->
```
<id min="1" max="10">
```
<!--ro, req, int, it corresponds to the <ID> in the request URI, attr:min{req, int},max{req, int}-->1
```
</id>
<module opt="main,sub" def="main">
```
<!--ro, opt, string, module to be configured: "main"-main module (default),"sub"-sub module, attr:opt{req, string},def{req, string}-->main
```
</module>
<moduleId min="1" max="10">
```
<!--ro, opt, int, sub module ID, attr:min{req, int},max{req, int}-->1
```
</moduleId>
<callMethod opt="callNumber,manageCenter,app,manualCallNumber,callStandardSIPNumber,callCenter" def="manageCenter">
```
<!--ro, opt, string, calling method, attr:opt{req, string},def{req, string}-->manageCenter
```
</callMethod>
<callNumber min="1" max="99999">
```
<!--ro, opt, string, called number, attr:min{req, int},max{req, int}, desc:called number-->101
```
</callNumber>
<enableCallCenter opt="true,false" def="true">
```
<!--ro, opt, bool, whether to call the management center, attr:opt{req, string},def{req, string}-->true
```
</enableCallCenter>
<readerID min="1" max="256">
```
<!--ro, opt, int, attr:min{req, int, range:[1,8]},max{req, int, range:[1,8]}-->1
```
</readerID>
<requireReaderID>
<!--ro, opt, bool-->true
</requireReaderID>
<DifferentKeystrokesList size="2">
```
<!--ro, opt, object, attr:size{req, int}-->
```
<Item>
<!--ro, opt, object-->
<keypress opt="short,long">
```
<!--ro, req, string, attr:opt{req, string}-->test
```
</keypress>
<callNumber min="1" max="32">
```
<!--ro, opt, string, called number, range:[1,32], attr:min{req, int},max{req, int}-->test
```
</callNumber>
<enableCallCenterByLong opt="true,false">
```
<!--ro, opt, bool, attr:opt{req, string}-->true
```
</enableCallCenterByLong>
</Item>
</DifferentKeystrokesList>
<templateNo min="1" max="32">
```
<!--ro, opt, int, range:[1,32], attr:min{req, int},max{req, int}-->1
```
</templateNo>
<customInfo min="0" max="128">
```
<!--ro, opt, string, custom information, range:[0,128], attr:min{req, int},max{req, int}-->test
```
</customInfo>
<callType opt="normal,alarm,bedheadTerminal,bedsideTerminal" def="normal">
```
<!--ro, opt, string, attr:opt{req, string},def{req, string}-->normal
```
</callType>
<linkageTemplateEnabled opt="true,false">
```
<!--ro, opt, bool, attr:opt{req, string}-->true
```
</linkageTemplateEnabled>
<enabled opt="true,false">
```
<!--ro, opt, bool, attr:opt{req, string}-->true
```
</enabled>
<terminalNo>
<!--ro, opt, object-->
<periodNumber min="1" max="999">
```
<!--ro, opt, int, range:[1,999], attr:min{req, int},max{req, int}-->1
```
</periodNumber>
<buildingNumber min="1" max="999">
```
<!--ro, opt, int, range:[1,999], attr:min{req, int},max{req, int}-->1
```
12.8.3.1 Get the configuration capability of pressing the button to call
Hikvision co MMC
adil@hikvision.co.az
```
<!--ro, opt, int, range:[1,999], attr:min{req, int},max{req, int}-->1
```
</buildingNumber>
<unitNumber min="1" max="999">
```
<!--ro, opt, int, range:[1,999], attr:min{req, int},max{req, int}-->1
```
</unitNumber>
<floorNumber min="1" max="999">
```
<!--ro, opt, int, range:[1,999], attr:min{req, int},max{req, int}-->1
```
</floorNumber>
<roomNumber min="1" max="999">
```
<!--ro, opt, int, range:[1,999], attr:min{req, int},max{req, int}-->1
```
</roomNumber>
<deviceIndex min="1" max="999">
```
<!--ro, opt, int, range:[1,999], attr:min{req, int},max{req, int}-->1
```
</deviceIndex>
</terminalNo>
<customFunctionType opt="preview,call,callElevator,openLock,answerAndReject,callMethod,doorbell,openMainDoorStationLock">
```
<!--ro, opt, string, attr:opt{req, string}-->preview
```
</customFunctionType>
<previewParams>
<!--ro, opt, object-->
<deviceType opt="ipc,outdoor,confirm">
```
<!--ro, req, string, attr:opt{req, string}-->outdoor
```
</deviceType>
<channelID min="1" max="16">
```
<!--ro, opt, int, range:[1,16], attr:min{req, int},max{req, int}-->1
```
</channelID>
<deviceIndex min="0" max="99">
```
<!--ro, opt, int, range:[0,99], attr:min{req, int},max{req, int}-->1
```
</deviceIndex>
</previewParams>
<callParams>
<!--ro, opt, object-->
<deviceType opt="indoor,manage">
```
<!--ro, req, string, attr:opt{req, string}-->indoor
```
</deviceType>
<subDeviceType opt="indoorStation,indoorExtension">
```
<!--ro, opt, string, attr:opt{req, string}-->test
```
</subDeviceType>
<periodNumber min="1" max="999">
```
<!--ro, opt, int, range:[1,999], attr:min{req, int},max{req, int}-->1
```
</periodNumber>
<buildingNumber min="1" max="999">
```
<!--ro, opt, int, range:[1,999], attr:min{req, int},max{req, int}-->1
```
</buildingNumber>
<unitNumber min="1" max="999">
```
<!--ro, opt, int, range:[1,999], attr:min{req, int},max{req, int}-->1
```
</unitNumber>
<roomNumber min="1" max="999">
```
<!--ro, opt, int, range:[1,999], attr:min{req, int},max{req, int}-->1
```
</roomNumber>
<deviceIndex min="1" max="999">
```
<!--ro, opt, int, range:[1,999], attr:min{req, int},max{req, int}-->1
```
</deviceIndex>
</callParams>
<openLockParams>
<!--ro, opt, object-->
<lockID min="1" max="2">
```
<!--ro, req, int, range:[1,2], attr:min{req, int},max{req, int}-->1
```
</lockID>
</openLockParams>
</KeyCfg>
Request URL
GET /ISAPI/VideoIntercom/keyCfg/<keyID>?readerID=<readerID>&moduleId=<subModuleID>
Query Parameter
Parameter
Name
Parameter
Type Description
keyID string --
readerID string The intelligent host has multiple card readers and needs to support obtaining by ID.
subModuleID string The sub-module ID corresponds to that obtained by sub-module list. If this parameter isnot included, configure the main module.
Request Message
None
Response Message
12.8.3.2 Get the parameters of pressing the button to call for a specific button
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<KeyCfg xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, attr:version{req, string, protocolVersion}-->
```
<id>
<!--ro, opt, int, button No., desc:button No.-->1
</id>
<module>
```
<!--ro, opt, enum, module to be configured, subType:string, desc:"main"(main module, by default), "sub" (sub module)-->main
```
</module>
<moduleId>
```
<!--ro, opt, int, sub module ID, dep:and,{$.KeyCfg.module,eq,sub}-->1
```
</moduleId>
<callMethod>
```
<!--ro, opt, enum, calling method, subType:string, desc:"callNumber" (call by number), "manageCenter" (call the management center), "app" (call APP),
```
```
"manualCallNumber" (manually call by number)-->callNumber
```
</callMethod>
<callNumber>
```
<!--ro, opt, string, called number, this field is valid when <callMethod> is "callNumber", dep:or,{$.KeyCfg.callMethod,eq,callNumber}-->101
```
</callNumber>
<enableCallCenter>
```
<!--ro, opt, bool, whether to call the management center, dep:or,{$.KeyCfg.callMethod,eq,manageCenter}-->true
```
</enableCallCenter>
<DifferentKeystrokesList>
<!--ro, opt, object-->
<Item>
<!--ro, opt, object-->
<keyPress>
<!--ro, req, enum, subType:string-->long
</keyPress>
<callNumber>
<!--ro, opt, string, called number, this field is valid when <callMethod> is "callNumber", range:[1,32]-->test
</callNumber>
<enableCallCenterByLong>
<!--ro, opt, bool-->true
</enableCallCenterByLong>
</Item>
</DifferentKeystrokesList>
<templateNo>
<!--ro, opt, int, range:[1,32]-->1
</templateNo>
<customInfo>
<!--ro, opt, string, custom information, range:[0,128]-->test
</customInfo>
<callType>
<!--ro, opt, enum, subType:string-->normal
</callType>
<linkageTemplateEnabled>
<!--ro, opt, bool-->true
</linkageTemplateEnabled>
<enabled>
<!--ro, opt, bool-->true
</enabled>
<terminalNo>
```
<!--ro, opt, object, dep:and,{$.KeyCfg.callType,eq,bedheadTerminal},{$.KeyCfg.callType,eq,bedsideTerminal}-->
```
<periodNumber>
<!--ro, opt, int, range:[1,999]-->1
</periodNumber>
<buildingNumber>
<!--ro, opt, int, range:[1,999]-->1
</buildingNumber>
<unitNumber>
<!--ro, opt, int, range:[1,999]-->1
</unitNumber>
<floorNumber>
<!--ro, opt, int, range:[1,999]-->1
</floorNumber>
<roomNumber>
<!--ro, opt, int, range:[1,999]-->1
</roomNumber>
<deviceIndex>
<!--ro, opt, int, range:[1,999]-->1
</deviceIndex>
</terminalNo>
<customFunctionType>
<!--ro, opt, enum, subType:string-->preview
</customFunctionType>
<previewParams>
```
<!--ro, opt, object, dep:and,{$.KeyCfg.customFunctionType,eq,preview}-->
```
<deviceType>
<!--ro, req, enum, subType:string-->ipc
</deviceType>
<channelID>
```
<!--ro, opt, int, range:[1,16], dep:and,{$.KeyCfg.previewParams.deviceType,eq,ipc}-->1
```
</channelID>
<deviceIndex>
```
<!--ro, opt, int, range:[0,99], dep:and,{$.KeyCfg.previewParams.deviceType,eq,outdoor},{$.KeyCfg.previewParams.deviceType,eq,confirm}-->1
```
</deviceIndex>
</previewParams>
<callParams>
```
<!--ro, opt, object, dep:and,{$.KeyCfg.customFunctionType,eq,call}-->
```
<deviceType>
<!--ro, req, enum, subType:string-->indoor
Hikvision co MMC
adil@hikvision.co.az
<!--ro, req, enum, subType:string-->indoor
</deviceType>
<subDeviceType>
```
<!--ro, opt, enum, subType:string, dep:and,{$.KeyCfg.callParams.deviceType,eq,indoor}-->indoorExtension
```
</subDeviceType>
<periodNumber>
<!--ro, opt, int, range:[1,999]-->1
</periodNumber>
<buildingNumber>
<!--ro, opt, int, range:[1,999]-->1
</buildingNumber>
<unitNumber>
<!--ro, opt, int, range:[1,999]-->1
</unitNumber>
<roomNumber>
<!--ro, opt, int, range:[1,999]-->1
</roomNumber>
<deviceIndex>
<!--ro, opt, int, range:[1,999]-->1
</deviceIndex>
</callParams>
<openLockParams>
```
<!--ro, opt, object, dep:and,{$.KeyCfg.customFunctionType,eq,openLock},{$.KeyCfg.customFunctionType,eq,openMainDoorStationLock}-->
```
<lockID>
<!--ro, req, int, range:[1,2]-->1
</lockID>
</openLockParams>
<keyType>
<!--ro, opt, enum, subType:string-->call
</keyType>
</KeyCfg>
Request URL
PUT /ISAPI/VideoIntercom/keyCfg/<keyID>?readerID=<readerID>&moduleId=<subModuleID>
Query Parameter
Parameter Name Parameter Type Description
keyID string --
readerID string --
subModuleID string --
Request Message
12.8.3.3 Set the parameters of pressing the button to call for a specific button
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<KeyCfg xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--req, object, attr:version{req, string, protocolVersion}-->
```
<id>
<!--opt, int, button No.-->0
</id>
<module>
```
<!--opt, enum, module to be configured, subType:string, desc:"main" (main module (default)), "sub" (sub module)-->main
```
</module>
<moduleId>
<!--opt, int, sub module ID, desc:this node is valid when <module> is "sub" and is used to specify that the button information of which module will be
configured-->1
</moduleId>
<callMethod>
```
<!--opt, enum, calling method, subType:string, desc:"callNumber" (call by number), "manageCenter" (call the management center), "app" (call APP),
```
```
"manualCallNumber" (manually call by number)-->callNumber
```
</callMethod>
<callNumber>
```
<!--opt, string, called number, dep:and,{$.KeyCfg.callMethod,eq,callNumber}-->101
```
</callNumber>
<enableCallCenter>
```
<!--opt, bool, whether to call the management center, dep:and,{$.KeyCfg.callMethod,eq,manageCenter}-->true
```
</enableCallCenter>
<DifferentKeystrokesList>
<!--opt, object-->
<Item>
<!--opt, object-->
<keyPress>
<!--req, enum, subType:string-->long
</keyPress>
<callNumber>
<!--opt, string, called number, range:[1,32], desc:this node is valid when <callMethod> is "callNumber"-->test
</callNumber>
<enableCallCenterByLong>
<!--opt, bool-->true
</enableCallCenterByLong>
</Item>
</DifferentKeystrokesList>
<templateNo>
<!--opt, int, range:[1,32]-->1
</templateNo>
<customInfo>
<!--opt, string, custom information, range:[0,128]-->test
</customInfo>
<callType>
<!--opt, enum, subType:string-->normal
</callType>
</KeyCfg>
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, desc:sub status code description-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/VideoIntercom/deviceId/capabilities?unitType=<unitType>
Query Parameter
12.8.4 Calling Target Management
12.8.4.1 Get the configuration capability of the video intercom device ID
Hikvision co MMC
adil@hikvision.co.az
Parameter Name Parameter Type Description
unitType enum false
Request Message
None
Response Message
<?xml version="1.0" encoding="UTF-8"?>
<DeviceId xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
<!--ro, req, object, device No.: 0-main station, other value-sub station. The device will reboot no matter <deviceIndex> is changed from 0 to other value
```
or from other value to 0, attr:version{req, string, protocolVersion}-->
```
<unitType
```
opt="villa,confirm,outdoor,fence,doorbell,manage,indoor,indoorStation,indoorExtension,analogIndoor,decoder,netAudio,amplifier,pagingMicrophone,interactive,b
```
edheadTerminal,bedsideTerminal,doorTerminal,visitTerminal,mobileInterative">
```
<!--ro, req, string, device type: “villa"-door station (V series), "confirm"-doorphone, "outdoor"-door station, "fence"-outer door station, "doorbell"-
```
doorbell, "manage"-main station, "acs"-intelligent access control. If this node is set to "confirm", the following nodes do not need to be configured,
```
attr:opt{req, string}-->test
```
</unitType>
<periodNumber min="1" max="999">
```
<!--ro, opt, int, community number, attr:min{req, int},max{req, int}-->0
```
</periodNumber>
<buildingNumber min="1" max="999">
```
<!--ro, opt, int, building number, attr:min{req, int},max{req, int}-->0
```
</buildingNumber>
<unitNumber min="1" max="999">
```
<!--ro, opt, int, unit number, attr:min{req, int},max{req, int}-->0
```
</unitNumber>
<floorNumber min="1" max="999">
```
<!--ro, opt, int, floor No., attr:min{req, int},max{req, int}-->0
```
</floorNumber>
<roomNumber min="1" max="999">
```
<!--ro, opt, int, room No., attr:min{req, int},max{req, int}-->0
```
</roomNumber>
<deviceIndex min="0" max="999">
```
<!--ro, opt, int, device No., attr:min{req, int},max{req, int}-->0
```
</deviceIndex>
<readerDeviceIndex min="0" max="99">
```
<!--ro, opt, int, step:1, attr:min{req, int},max{req, int}-->0
```
</readerDeviceIndex>
<communityNumber min="0" max="32">
```
<!--ro, opt, string, community No., attr:min{req, int},max{req, int}-->test
```
</communityNumber>
<customDeviceId min="0" max="32">
```
<!--ro, opt, string, attr:min{req, int},max{req, int}-->test
```
</customDeviceId>
<periodNumberName min="0" max="32">
```
<!--ro, opt, string, range:[0,32], attr:min{req, int},max{req, int}-->test
```
</periodNumberName>
<buildingNumberName min="0" max="32">
```
<!--ro, opt, string, range:[0,32], attr:min{req, int},max{req, int}-->test
```
</buildingNumberName>
<unitNumberName min="0" max="32">
```
<!--ro, opt, string, range:[0,32], attr:min{req, int},max{req, int}-->test
```
</unitNumberName>
<floorNumberName min="0" max="32">
```
<!--ro, opt, string, range:[0,32], attr:min{req, int},max{req, int}-->test
```
</floorNumberName>
<roomNumberName min="0" max="32">
```
<!--ro, opt, string, range:[0,32], attr:min{req, int},max{req, int}-->test
```
</roomNumberName>
<deviceIndexName min="0" max="32">
```
<!--ro, opt, string, range:[0,32], attr:min{req, int},max{req, int}-->test
```
</deviceIndexName>
<communityNumberName min="0" max="32">
```
<!--ro, opt, string, range:[0,32], attr:min{req, int},max{req, int}-->test
```
</communityNumberName>
<enabled opt="true,false">
```
<!--ro, opt, bool, attr:opt{req, string}-->true
```
</enabled>
<industryType opt="builidings,prison,medicalTreatment,broadcasting">
```
<!--ro, opt, string, attr:opt{req, string}-->test
```
</industryType>
<readerID min="1" max="8">
```
<!--ro, opt, int, range:[1,8], attr:min{req, int, range:[1,8]},max{req, int, range:[1,8]}-->1
```
</readerID>
<requireReaderID>
<!--ro, opt, bool-->true
</requireReaderID>
<isSupportZeroFloorNumber>
<!--ro, opt, bool-->true
</isSupportZeroFloorNumber>
<periodNumberRealName min="0" max="64">
```
<!--ro, opt, string, range:[0,32], attr:min{req, int},max{req, int}-->test
```
</periodNumberRealName>
<buildingNumberRealName min="0" max="32">
```
<!--ro, opt, string, range:[0,32], attr:min{req, int},max{req, int}-->test
```
Hikvision co MMC
adil@hikvision.co.az
```
<!--ro, opt, string, range:[0,32], attr:min{req, int},max{req, int}-->test
```
</buildingNumberRealName>
<unitNumberRealName min="0" max="32">
```
<!--ro, opt, string, range:[0,32], attr:min{req, int},max{req, int}-->test
```
</unitNumberRealName>
<roomNumberRealName min="0" max="32">
```
<!--ro, opt, string, range:[0,32], attr:min{req, int},max{req, int}-->test
```
</roomNumberRealName>
<deviceIndexRealName min="0" max="32">
```
<!--ro, opt, string, range:[0,32], attr:min{req, int},max{req, int}-->test
```
</deviceIndexRealName>
</DeviceId>
Request URL
GET /ISAPI/VideoIntercom/deviceId?readerID=<readerID>
Query Parameter
Parameter
Name
Parameter
Type Description
readerID string
The intelligent host has multiple card readers, which need to support configuration by ID.
When the readerID does not exist, it indicates configuration for the host. The host supports
SIP service and SIP client, and the SIP client is used for registration to the management
host.
Request Message
None
Response Message
12.8.4.2 Get the video intercom device ID
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<DeviceId xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, device No., attr:version{req, string, protocolVersion}-->
```
<unitType>
```
<!--ro, req, enum, device type, subType:string, desc:"villa"-door station (V series), "confirm"-doorphone, "outdoor"-door station, "fence"-outer door
```
station, "doorbell"-doorbell, "manage"-main station, "acs"-intelligent access control. If this node is set to "confirm", the following nodes do not need to
be configured-->villa
</unitType>
<periodNumber>
<!--ro, opt, int, community number, range:[1,999]-->1
</periodNumber>
<buildingNumber>
<!--ro, opt, int, building number, range:[1,999]-->1
</buildingNumber>
<unitNumber>
<!--ro, opt, int, unit number, range:[1,999]-->1
</unitNumber>
<floorNumber>
<!--ro, opt, int, floor No., it is between -10 and 10 and it cannot be 0, range:[1,999], desc:floor No., it is between -10 and 10 and it cannot be 0-->1
</floorNumber>
<roomNumber>
<!--ro, opt, int, room No., range:[1,999]-->1
</roomNumber>
<deviceIndex>
```
<!--ro, opt, int, device No., 0-main station, other value (from 0 to 99)-sub station. The device will reboot no matter <deviceIndex> is changed from 0
```
to other value or from other value to 0, range:[0,999]-->1
</deviceIndex>
<communityNumber>
<!--ro, opt, string, community No.-->test
</communityNumber>
<customDeviceId>
<!--ro, opt, string-->test
</customDeviceId>
<periodNumberName>
<!--ro, opt, string, range:[0,32]-->test
</periodNumberName>
<buildingNumberName>
<!--ro, opt, string, range:[0,32]-->test
</buildingNumberName>
<unitNumberName>
<!--ro, opt, string, range:[0,32]-->test
</unitNumberName>
<floorNumberName>
<!--ro, opt, string, range:[0,32]-->test
</floorNumberName>
<roomNumberName>
<!--ro, opt, string, range:[0,32]-->test
</roomNumberName>
<deviceIndexName>
<!--ro, opt, string, range:[0,32]-->test
</deviceIndexName>
<communityNumberName>
<!--ro, opt, string, range:[0,128]-->test
</communityNumberName>
<enabled>
<!--ro, opt, bool-->true
</enabled>
<industryType>
<!--ro, opt, enum, subType:string-->builidings
</industryType>
<periodNumberRealName>
<!--ro, opt, string, range:[0,64]-->test
</periodNumberRealName>
<buildingNumberRealName>
<!--ro, opt, string, range:[0,32]-->test
</buildingNumberRealName>
<unitNumberRealName>
<!--ro, opt, string, range:[0,32]-->test
</unitNumberRealName>
<roomNumberRealName>
<!--ro, opt, string, range:[0,32]-->test
</roomNumberRealName>
<deviceIndexRealName>
<!--ro, opt, string, range:[0,32]-->test
</deviceIndexRealName>
</DeviceId>
Request URL
PUT /ISAPI/VideoIntercom/deviceId?readerID=<readerID>
Query Parameter
12.8.4.3 Set the video intercom device ID
Hikvision co MMC
adil@hikvision.co.az
Parameter Name Parameter Type Description
readerID string --
Request Message
<?xml version="1.0" encoding="UTF-8"?>
<DeviceId xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--req, object, device No., attr:version{req, string, protocolVersion}-->
```
<unitType>
<!--req, enum, device type, subType:string, desc:device type-->villa
</unitType>
<periodNumber>
<!--opt, int, community number-->0
</periodNumber>
<buildingNumber>
<!--opt, int, building number-->0
</buildingNumber>
<unitNumber>
<!--opt, int, unit number-->0
</unitNumber>
<floorNumber>
<!--opt, int, floor No., desc:floor No.-->0
</floorNumber>
<roomNumber>
<!--opt, int, room No.-->0
</roomNumber>
<deviceIndex>
<!--opt, int, device No.-->0
</deviceIndex>
<communityNumber>
<!--opt, string, community No.-->test
</communityNumber>
<customDeviceId>
<!--opt, string-->test
</customDeviceId>
<periodNumberName>
<!--opt, string, range:[0,32]-->test
</periodNumberName>
<buildingNumberName>
<!--opt, string, range:[0,32]-->test
</buildingNumberName>
<unitNumberName>
<!--opt, string, range:[0,32]-->test
</unitNumberName>
<floorNumberName>
<!--opt, string, range:[0,32]-->test
</floorNumberName>
<roomNumberName>
<!--opt, string, range:[0,32]-->test
</roomNumberName>
<deviceIndexName>
<!--opt, string, range:[0,32]-->test
</deviceIndexName>
<communityNumberName>
<!--opt, string, range:[0,128]-->test
</communityNumberName>
<enabled>
<!--opt, bool-->true
</enabled>
<industryType>
<!--opt, enum, subType:string-->builidings
</industryType>
</DeviceId>
Response Message
Hikvision co MMC
adil@hikvision.co.az
<?xml version="1.0" encoding="UTF-8"?>
<ResponseStatus xmlns="http://www.isapi.org/ver20/XMLSchema" version="2.0">
```
<!--ro, req, object, response message, attr:version{ro, req, string, protocolVersion}-->
```
<requestURL>
<!--ro, req, string, request URL-->null
</requestURL>
<statusCode>
```
<!--ro, req, enum, status code, subType:int, desc:0 (OK), 1 (OK), 2 (Device Busy), 3 (Device Error), 4 (Invalid Operation), 5 (Invalid XML Format), 6
```
```
(Invalid XML Content), 7 (Reboot Required)-->0
```
</statusCode>
<statusString>
```
<!--ro, req, enum, status information, subType:string, desc:"OK" (succeeded), "Device Busy", "Device Error", "Invalid Operation", "Invalid XML Format",
```
```
"Invalid XML Content", "Reboot" (reboot device)-->OK
```
</statusString>
<subStatusCode>
<!--ro, req, string, sub status code, which describes the error in details, desc:sub status code, which describes the error in details-->OK
</subStatusCode>
</ResponseStatus>
Request URL
GET /ISAPI/SecurityCP/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"SecurityCPCap": {
```
/*ro, req, object, capability node*/
"partitionNum": 64,
/*ro, opt, int, number of partitions that can be set, desc:1 by default*/
"localZoneNum": 16,
/*ro, req, int, number of local zones*/
"extendZoneNum": 64,
/*ro, opt, int, number of extended zones*/
"wirelessZoneNum": 64,
/*ro, opt, int, number of wireless zones*/
"localRelayNum": 1,
/*ro, req, int, number of local triggers*/
"extendRelayNum": 1,
/*ro, opt, int, number of extended triggers*/
"wirelessRelayNum": 1,
/*ro, opt, int, number of wireless triggers*/
"repeater": 4,
/*ro, opt, int, number of repeaters*/
"sirenNum": 8,
/*ro, opt, int, number of sounders*/
"userNum": 1,
/*ro, req, int, number of users*/
"adminNum": 2,
/*ro, opt, int, number of administrators*/
"installerNum": 21,
/*ro, opt, int, number of installers*/
"operatorNum": 41,
/*ro, opt, int, number of operators*/
"ARCNum": 4,
/*ro, opt, int, number of alarm receiving centers*/
"phoneNum": 3,
/*ro, opt, int, number of phone numbers*/
"outputModNum": 8,
/*ro, opt, int, number of output modules*/
"cardNum": 64,
/*ro, opt, int, number of cards*/
"keypadNum": 8,
/*ro, opt, int, number of keypads*/
"cardReaderNum": 8,
/*ro, opt, int, number of card readers*/
"protocolOptimizationVersion": "v1.0",
/*ro, opt, string, supported protocol optimizing version*/
"remoteCtrlNum": 64,
/*ro, opt, int, number of remote controls*/
12.9 Zone Alarm
12.9.1 Alarm System Management
12.9.1.1 Get the capability of security control panel
Hikvision co MMC
adil@hikvision.co.az
/*ro, opt, int, number of remote controls*/
"alarmLampNum": 8,
/*ro, opt, int, number of strobe lights*/
"electricLockNum": 64,
/*ro, opt, int, number of electric locks*/
```
"detectorModel": {
```
/*ro, opt, object, supported detector models*/
"@opt": ["0x00001", "0x00002"]
/*ro, opt, array, options, subType:string*/
```
},
```
```
"sirenModel": {
```
/*ro, opt, object, supported sounder models*/
"@opt": ["0x7A001", "0x7A011"]
/*ro, opt, array, options, subType:string*/
```
},
```
```
"keypadModel": {
```
/*ro, opt, object, supported keypad models*/
"@opt": ["0x92000", "0x92010"]
/*ro, opt, array, options, subType:string*/
```
},
```
```
"cardReaderModel": {
```
/*ro, opt, object, supported card reader models*/
"@opt": ["0x90000", "0x90010"]
/*ro, opt, array, options, subType:string*/
```
},
```
```
"remoteCtrlModel": {
```
/*ro, opt, object, supported remote control models*/
"@opt": ["0x81000", "0x81010"]
/*ro, opt, array, options, subType:string*/
```
},
```
```
"repeaterModel": {
```
/*ro, opt, object, supported repeater models*/
"@opt": ["0x80000", "0x80010"]
/*ro, opt, array, options, subType:string*/
```
},
```
```
"outputModuleModel": {
```
/*ro, opt, object, supported output module models*/
"@opt": ["0x71001", "0x71011"]
/*ro, opt, array, options, subType:string*/
```
},
```
"isSptLogSearch": true,
/*ro, opt, bool, whether it supports log search*/
"isSptLocalUser": true,
/*ro, opt, bool, whether it supports local users*/
"isSptConfiguration": true,
/*ro, opt, bool, whether it supports configuring security control panel, desc:/ISAPI/SecurityCP/Configuration*/
"isSptControl": true,
/*ro, opt, bool, whether it supports security control panel control, desc:/ISAPI/SecurityCP/control*/
"isSptStatus": true,
/*ro, opt, bool, whether it supports monitoring security control panel status, desc:/ISAPI/SecurityCP/status*/
"isSptZoneInfo": true,
/*ro, opt, bool, whether it supports getting the information of a specific zone, desc:/ISAPI/SecurityCP/Info/zones/<ID>?format=json*/
"isSptSirenInfo": true,
/*ro, opt, bool, whether it supports getting the information of a specific sounder, desc:/ISAPI/SecurityCP/Info/siren/<ID>?format=json*/
"isSptPaceTest": true,
/*ro, opt, bool, whether it supports pacing, desc:/ISAPI/SecurityCP/paceTest*/
"isSptStandardCfg": true,
/*ro, opt, bool, whether it supports standard configuration for security control panel, desc:/ISAPI/SecurityCP/standardCfg*/
"isSptPircamCapture": true,
```
/*ro, opt, bool, whether it supports pircam (detector equipped with camera) capture, desc:/ISAPI/SecurityCP/pircam/channels/<ID>/picture?
```
```
format=json*/
```
"isSptManualControlCapture": true,
/*ro, opt, bool*/
"isSptGetPictureByURL": true,
/*ro, opt, bool*/
"isSptOneKeyAlarm": true,
/*ro, opt, bool, whether it supports one-push alarm, desc:/ISAPI/SecurityCP/control/oneKeyAlarm. For compatibility, this node will also be returned
in the capability message JSON_HostControlCap after calling the URI /ISAPI/SecurityCP/control/capabilities?format=json by GET method*/
"isSptOneKeyAlarmSoundCtrl": true,
/*ro, opt, bool*/
"transmitterNum": 8,
/*ro, opt, int, the number of transmitters*/
```
"transmitterModel": {
```
/*ro, opt, object, supported model of transmitters*/
"@opt": ["0x71001"]
/*ro, opt, array, options, subType:string*/
```
},
```
```
"localAccessModuleType": {
```
/*ro, opt, object, onboard access module type*/
"@opt": ["localTransmitter", "localZone", "localRelay", "localSiren"]
```
/*ro, opt, array, options, subType:string, desc:"localTransmitter" (onboard transmitter), "localZone" (onboard zone module), "localRelay"
```
```
(onboard relay module), "localSiren" (onboard sounder module)*/
```
```
},
```
"networkZoneModuleNum": 8
/*ro, opt, int, number of network zone modules*/
```
}
```
```
}
```
Request URL
12.9.1.2 Get the configuration capability of security control panel
Hikvision co MMC
adil@hikvision.co.az
GET /ISAPI/SecurityCP/Configuration/capabilities?format=json
Query Parameter
None
Request Message
None
Response Message
```
{
```
```
"HostConfigCap": {
```
/*ro, req, object, capability node*/
```
"ExDevice": {
```
/*ro, opt, object, peripheral node*/
"isSptOutput": true,
/*ro, opt, bool, whether it supports relay management, desc:/ISAPI/SecurityCP/Configuration/outputs*/
```
},
```
"isSptReportCenterCfg": true,
/*ro, opt, bool, whether it supports configuring the report uploading method, desc:/ISAPI/SecurityCP/ReportCenterCfg/<ID>?format=json*/
"isSptAlarmOutCfg": true,
/*ro, opt, bool, whether it supports configuring alarm output parameters, desc:/ISAPI/SecurityCP/AlarmOutCfg/<ID>?format=json*/
"isSptSetAlarmHostOut": true,
/*ro, opt, bool, whether it supports setting alarm output, desc:/ISAPI/SecurityCP/SetAlarmHostOut?format=json*/
```
}
```
```
}
```
If you need access to corresponding video guidance for device integration, please register on https://tpp.hikvision.com
and visit our Training Center: https://tpp.hikvision.com/tpp/Training. The Training Center is specifically designed to
provide technical training and guidance resources for our partners. On this platform, you can find integration video
tutorials for various devices, enabling better understanding and learning of the integration process. To offer more
personalized service, our Training Center also supports filtering by integration protocols, devices, and applications.
13 How-To Video Guidance
Hikvision co MMC
adil@hikvision.co.az