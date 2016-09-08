---
layout: default
title: Azure install
---

# Docs

* [Main docs here](https://azure.microsoft.com/en-us/documentation/articles/functions-reference/)

* for c#, it uses scriptcs, instead of c#

# Prerequisites

* Azure subscription, register at [azure.microsoft.com](https://azure.microsoft.com), you can also use free trial
* If you have MSDN, you likely already have access
* there is a [command line interface for azure functions](https://github.com/azure/azure-webjobs-sdk-script/pull/477), but not yet officially released
  * just run `func new` to set it up

# Setup functions

* on [functions.azure.com](https://functions.azure.com), create a new function app
* app name will be randomly generated
* create webhook+API function
* template -- choose c# or JS, see [Azure github repo](https://github.com/azure/azure-webjobs-sdk-templates/)
* standard mode _http trigger_, authorization level _anonymous_ 
* configuration becomes a JSON definition of inputs/outputs/maps...
* you can control memory, CORS etc for your function from in *Function App Settings* -- make sure to configure CORS 
  * if you want to add a wildcard (_*_) then remove everything else
  * Kudu is a super-admin dashboard for websites in azure, can also be used for this, gives you a browser to check what's actually deployed

# Deploy

_Function App Settings_ -> _Configure continuous integration_

* ftp access
* or github push
* or dropbox folder sync ...
* or visual studio
* or IIS webdeploy
* or Kudu, just drag + drop


# Troubleshooting

* in _Manage_ you see the hosting stack traces for errors, but in _Develop_ you can see the actual Node.js stack traces
* You can use Kudu, then LogsFiles

# Differences from Lambda

* no multiversioning, but you can use "deployment slots"
* concept of function apps, not completely independent functions
  * one function = one URL, function name is part of the URL
  * so create a function app with 2 functions, info and command
  * convention: name of the folder is the name of the function
* use git push for atomic deployments


# When deploying from command line

* make sure to set "authLevel": "anonymous" in bindings/httpTrigger
* no way to set CORS in the JSON file, have to set it from the portal
* make sure that http method POST is allowed, or remove "GET" from the /command function

