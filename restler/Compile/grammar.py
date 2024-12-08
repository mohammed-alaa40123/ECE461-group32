""" THIS IS AN AUTOMATICALLY GENERATED FILE!"""
from __future__ import print_function
import json
from engine import primitives
from engine.core import requests
from engine.errors import ResponseParsingException
from engine import dependencies
req_collection = requests.RequestCollection([])

token = "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjgsIm5hbWUiOiJlY2UzMDg2MWRlZmF1bHRhZG1pbnVzZXIiLCJpYXQiOjE3MzM1OTYzMTksImV4cCI6MTczMzYzMjMxOX0.g-Hz6r0utSzdmuT9iv-3eeplXj8fWgqSWDHxOLpaxhM"
# Endpoint: /packages, method: Post
request = requests.Request([
    primitives.restler_static_string("POST "),
    primitives.restler_basepath("/prod"),
    primitives.restler_static_string("/"),
    primitives.restler_static_string("packages"),
    primitives.restler_static_string("?"),
    primitives.restler_static_string("offset="),
    primitives.restler_fuzzable_string("fuzzstring", quoted=False, examples=["1"]),
    primitives.restler_static_string(" HTTP/1.1\r\n"),
    primitives.restler_static_string("Accept: application/json\r\n"),
    primitives.restler_static_string("Host: zy5br6rkxd.execute-api.us-east-1.amazonaws.com\r\n"),
    primitives.restler_static_string("X-Authorization: "),
    primitives.restler_static_string(token),
    # primitives.restler_fuzzable_string("fuzzstring", quoted=False),
    primitives.restler_static_string("\r\n"),
    primitives.restler_static_string("Content-Type: "),
    primitives.restler_static_string("application/json"),
    primitives.restler_static_string("\r\n"),
    primitives.restler_refreshable_authentication_token("authentication_token_tag"),
    primitives.restler_static_string("\r\n"),
    primitives.restler_static_string("["),
    primitives.restler_static_string("""
    {
        "Version":
            "Exact (1.2.3)\nBounded range (1.2.3-2.1.0)\nCarat (^1.2.3)\nTilde (~1.2.0)"
        ,
        "Name":
            """),
    primitives.restler_fuzzable_string("fuzzstring", quoted=True),
    primitives.restler_static_string("""
    }]"""),
    primitives.restler_static_string("\r\n"),

],
requestId="/packages"
)
req_collection.add_request(request)

# Endpoint: /package/{id}, method: Get
request = requests.Request([
    primitives.restler_static_string("GET "),
    primitives.restler_basepath("/prod"),
    primitives.restler_static_string("/"),
    primitives.restler_static_string("package"),
    primitives.restler_static_string("/"),
    primitives.restler_fuzzable_string("fuzzstring", quoted=False, examples=["123567192081501"]),
    primitives.restler_static_string(" HTTP/1.1\r\n"),
    primitives.restler_static_string("Accept: application/json\r\n"),
    primitives.restler_static_string("Host: zy5br6rkxd.execute-api.us-east-1.amazonaws.com\r\n"),
    primitives.restler_static_string("X-Authorization: "),
    primitives.restler_static_string(token),
    primitives.restler_fuzzable_string("fuzzstring", quoted=False, examples=["bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"]),
    primitives.restler_static_string("\r\n"),
    primitives.restler_refreshable_authentication_token("authentication_token_tag"),
    primitives.restler_static_string("\r\n"),

],
requestId="/package/{id}"
)
req_collection.add_request(request)

# Endpoint: /package/{id}, method: Post
request = requests.Request([
    primitives.restler_static_string("POST "),
    primitives.restler_basepath("/prod"),
    primitives.restler_static_string("/"),
    primitives.restler_static_string("package"),
    primitives.restler_static_string("/"),
    primitives.restler_fuzzable_string("fuzzstring", quoted=False, examples=["123567192081501"]),
    primitives.restler_static_string(" HTTP/1.1\r\n"),
    primitives.restler_static_string("Accept: application/json\r\n"),
    primitives.restler_static_string("Host: zy5br6rkxd.execute-api.us-east-1.amazonaws.com\r\n"),
    primitives.restler_static_string("X-Authorization: "),
    primitives.restler_static_string(token),
    #primitives.restler_fuzzable_string("fuzzstring", quoted=False, examples=["bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsIm5hbWUiOiJhY2FsaSIsImlhdCI6MTczMjQ2NjcxNSwiZXhwIjoxNzMyNTAyNzE1fQ.lGaee3YjjXVuTvSFX1gzhb7u_Y3jtXap7tu8mhxMtF4"]),
    primitives.restler_static_string("\r\n"),
    # primitives.restler_static_string("Content-Type: "),
    # primitives.restler_static_string("application/json"),
    # primitives.restler_static_string("\r\n"),
    primitives.restler_refreshable_authentication_token("authentication_token_tag"),
    primitives.restler_static_string("\r\n"),
    primitives.restler_static_string("{"),
    primitives.restler_static_string("""
    "metadata":
        {
            "Name":
                """),
    primitives.restler_fuzzable_string("fuzzstring", quoted=True),
    primitives.restler_static_string("""
            ,
            "Version":"""),
    primitives.restler_fuzzable_string("fuzzstring", quoted=True, examples=["1.2.3"]),
    primitives.restler_static_string(""",
            "ID":
                """),
    primitives.restler_fuzzable_string("fuzzstring", quoted=True, examples=["123567192081501"]),
    primitives.restler_static_string("""
        }
    ,
    "data":
        {
            "Name":
                """),
    primitives.restler_fuzzable_object("{ \"fuzz\": false }"),
    primitives.restler_static_string("""
            ,
            "Content":"""),
    primitives.restler_fuzzable_string("fuzzstring", quoted=True),
    primitives.restler_static_string(""",
            "URL":"""),
    primitives.restler_fuzzable_string("fuzzstring", quoted=True),
    primitives.restler_static_string(""",
            "debloat":"""),
    primitives.restler_fuzzable_bool("true"),
    primitives.restler_static_string(""",
            "JSProgram":"""),
    primitives.restler_fuzzable_string("fuzzstring", quoted=True),
    primitives.restler_static_string("""
        }
    }"""),
    primitives.restler_static_string("\r\n"),

],
requestId="/package/{id}"
)
req_collection.add_request(request)

# Endpoint: /package, method: Post
request = requests.Request([
    primitives.restler_static_string("POST "),
    primitives.restler_basepath("/prod"),
    primitives.restler_static_string("/"),
    primitives.restler_static_string("package"),
    primitives.restler_static_string(" HTTP/1.1\r\n"),
    primitives.restler_static_string("Content-Type: "),
    primitives.restler_static_string("application/json"),
    primitives.restler_static_string("\r\n"),
    # primitives.restler_static_string("Accept: application/json\r\n"),
    primitives.restler_static_string("Host: zy5br6rkxd.execute-api.us-east-1.amazonaws.com\r\n"),
    primitives.restler_static_string("X-Authorization: "),
    primitives.restler_static_string(token),
    # primitives.restler_fuzzable_string("fuzzstring", quoted=False),
    # primitives.restler_static_string("\r\n"),
    # primitives.restler_static_string("Content-Type: "),
    # primitives.restler_static_string("application/json"),
    primitives.restler_static_string("\r\n"),
    primitives.restler_refreshable_authentication_token("authentication_token_tag"),
    primitives.restler_static_string("\r\n"),
    primitives.restler_static_string("{"),
    # primitives.restler_static_string("""
    # "Name":
    #     """),
    # primitives.restler_fuzzable_object("{ \"fuzz\": false }"),
    # primitives.restler_static_string("""
    # ,
    # "Content":"""),
    # primitives.restler_fuzzable_string("fuzzstring", quoted=True),
    primitives.restler_static_string("""
    "JSProgram":"""),
    primitives.restler_static_string("""
    "if (process.argv.length === 7) {\\nconsole.log('Success')\\nprocess.exit(0)\\n} else {\\nconsole.log('Failed')\\nprocess.exit(1)\\n}","""),
    primitives.restler_static_string("""
    "URL":"""),
    primitives.restler_static_string("""
    "https://github.com/lodash/lodash","""),
    primitives.restler_static_string("""
    "debloat":"""),
    primitives.restler_fuzzable_bool(" true\n"),
    # primitives.restler_static_string(""",
    # "JSProgram":"""),
    # primitives.restler_fuzzable_string("fuzzstring", quoted=True),
    primitives.restler_static_string("}"),
    # primitives.restler_static_string("\r\n"),

],
requestId="/package"
)
req_collection.add_request(request)

# Endpoint: /package/{id}/rate, method: Get
request = requests.Request([
    primitives.restler_static_string("GET "),
    primitives.restler_basepath("/prod"),
    primitives.restler_static_string("/"),
    primitives.restler_static_string("package"),
    primitives.restler_static_string("/"),
    primitives.restler_fuzzable_string("fuzzstring", quoted=False, examples=["123567192081501"]),
    primitives.restler_static_string("/"),
    primitives.restler_static_string("rate"),
    primitives.restler_static_string(" HTTP/1.1\r\n"),
    primitives.restler_static_string("Accept: application/json\r\n"),
    primitives.restler_static_string("Host: zy5br6rkxd.execute-api.us-east-1.amazonaws.com\r\n"),
    primitives.restler_static_string("X-Authorization: "),
    primitives.restler_static_string(token),
    # primitives.restler_fuzzable_string("fuzzstring", quoted=False),
    primitives.restler_static_string("\r\n"),
    primitives.restler_refreshable_authentication_token("authentication_token_tag"),
    primitives.restler_static_string("\r\n"),

],
requestId="/package/{id}/rate"
)
req_collection.add_request(request)

# Endpoint: /package/{id}/cost, method: Get
request = requests.Request([
    primitives.restler_static_string("GET "),
    primitives.restler_basepath("/prod"),
    primitives.restler_static_string("/"),
    primitives.restler_static_string("package"),
    primitives.restler_static_string("/"),
    primitives.restler_fuzzable_string("fuzzstring", quoted=False, examples=["123567192081501"]),
    primitives.restler_static_string("/"),
    primitives.restler_static_string("cost"),
    primitives.restler_static_string("?"),
    primitives.restler_static_string("dependency="),
    primitives.restler_fuzzable_bool("true"),
    primitives.restler_static_string(" HTTP/1.1\r\n"),
    primitives.restler_static_string("Accept: application/json\r\n"),
    primitives.restler_static_string("Host: zy5br6rkxd.execute-api.us-east-1.amazonaws.com\r\n"),
    primitives.restler_static_string("X-Authorization: "),
    primitives.restler_static_string(token),
    # primitives.restler_fuzzable_string("fuzzstring", quoted=False),
    primitives.restler_static_string("\r\n"),
    primitives.restler_refreshable_authentication_token("authentication_token_tag"),
    primitives.restler_static_string("\r\n"),

],
requestId="/package/{id}/cost"
)
req_collection.add_request(request)

# Endpoint: /authenticate, method: Put
request = requests.Request([
    primitives.restler_static_string("PUT "),
    primitives.restler_basepath("/prod"),
    primitives.restler_static_string("/"),
    primitives.restler_static_string("authenticate"),
    primitives.restler_static_string(" HTTP/1.1\r\n"),
    primitives.restler_static_string("Accept: application/json\r\n"),
    primitives.restler_static_string("Host: zy5br6rkxd.execute-api.us-east-1.amazonaws.com\r\n"),
    primitives.restler_static_string("Content-Type: "),
    primitives.restler_static_string("application/json"),
    primitives.restler_static_string("\r\n"),
    primitives.restler_refreshable_authentication_token("authentication_token_tag"),
    primitives.restler_static_string("\r\n"),
    primitives.restler_static_string("{"),
    #primitives.restler_static_string(""""user": {"name": "", "isAdmin": true}, "Secret": {"password": "correcthorsebatterystaple123(!__+@**(A'\\\"`;DROP TABLE packages;\"}"""),
    primitives.restler_static_string("""
    "User":
        {"name":"""),
    primitives.restler_fuzzable_string("fuzzstring", quoted=True, examples=["acali"]),
    primitives.restler_static_string(""",
            "isAdmin":"""),
    primitives.restler_fuzzable_bool("true"),
    primitives.restler_static_string("""
        }
    ,
    "Secret":
        {
            "password":"""),
    primitives.restler_static_string("caliand000", quoted=True),
    primitives.restler_static_string("""
        }
    }"""),
    primitives.restler_static_string("\r\n"),

],
requestId="/authenticate"
)
req_collection.add_request(request)

# Endpoint: /package/byRegEx, method: Post
request = requests.Request([
    primitives.restler_static_string("POST "),
    primitives.restler_basepath("/prod"),
    primitives.restler_static_string("/"),
    primitives.restler_static_string("package"),
    primitives.restler_static_string("/"),
    primitives.restler_static_string("byRegEx"),
    primitives.restler_static_string(" HTTP/1.1\r\n"),
    primitives.restler_static_string("Accept: application/json\r\n"),
    primitives.restler_static_string("Host: zy5br6rkxd.execute-api.us-east-1.amazonaws.com\r\n"),
    primitives.restler_static_string("X-Authorization: "),
    primitives.restler_static_string(token),
    # primitives.restler_fuzzable_string("fuzzstring", quoted=False, examples=["bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"]),
    primitives.restler_static_string("\r\n"),
    primitives.restler_static_string("Content-Type: "),
    primitives.restler_static_string("application/json"),
    primitives.restler_static_string("\r\n"),
    primitives.restler_refreshable_authentication_token("authentication_token_tag"),
    primitives.restler_static_string("\r\n"),
    primitives.restler_static_string("{"),
    primitives.restler_static_string("""
    "RegEx":"""),
    primitives.restler_fuzzable_string("fuzzstring", quoted=True),
    primitives.restler_static_string("}"),
    primitives.restler_static_string("\r\n"),

],
requestId="/package/byRegEx"
)
req_collection.add_request(request)

# Endpoint: /tracks, method: Get
request = requests.Request([
    primitives.restler_static_string("GET "),
    primitives.restler_basepath("/prod"),
    primitives.restler_static_string("/"),
    primitives.restler_static_string("tracks"),
    primitives.restler_static_string(" HTTP/1.1\r\n"),
    primitives.restler_static_string("Accept: application/json\r\n"),
    primitives.restler_static_string("Host: zy5br6rkxd.execute-api.us-east-1.amazonaws.com\r\n"),
    # primitives.restler_static_string("X-Authorization: "),
    # primitives.restler_static_string(token),
    primitives.restler_refreshable_authentication_token("authentication_token_tag"),
    primitives.restler_static_string("\r\n"),

],
requestId="/tracks"
)
req_collection.add_request(request)

# # Endpoint: /reset, method: Delete
# request = requests.Request([
#     primitives.restler_static_string("DELETE "),
#     primitives.restler_basepath("/prod"),
#     primitives.restler_static_string("/"),
#     primitives.restler_static_string("reset"),
#     primitives.restler_static_string(" HTTP/1.1\r\n"),
#     primitives.restler_static_string("Accept: application/json\r\n"),
#     primitives.restler_static_string("Host: zy5br6rkxd.execute-api.us-east-1.amazonaws.com\r\n"),
#     primitives.restler_static_string("X-Authorization: "),
#     primitives.restler_static_string(token),
#     # primitives.restler_fuzzable_string("fuzzstring", quoted=False),
#     primitives.restler_static_string("\r\n"),
#     primitives.restler_refreshable_authentication_token("authentication_token_tag"),
#     primitives.restler_static_string("\r\n"),

# ],
# requestId="/reset"
# )
# req_collection.add_request(request)
