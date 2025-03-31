@echo off
rem this is a bit of a hack, but it works. 
rem we need to use the version from package.json, so we set it in an env var and use that in the command later

rem extract the version from package.json and write it to a batch file that sets it into an env var
node -e "var fs = require('fs'); var pck = require('./package.json'); var version = pck.version; var cmd = '@echo off\nSET BUILD_VERSION=' + version + '\n'; fs.writeFileSync('set_version.bat', cmd);"

rem add command to overwrite the metadata in the exe using the version from env var
echo node_modules\verpatch\bin\verpatch.exe %1 %%BUILD_VERSION%% /high /pv %%BUILD_VERSION%% /s CompanyName "Ministry of Health Israel" /s FileDescription "MoH Israel - FHIR Certificator" /s LegalCopyright "AGPL-3.0 license. Copyright Ministry of Health Israel & Certificator contributors" /s OriginalFilename "certificator.exe" /s ProductName "FHIR Certificator" /s InternalName "certificator" >> set_version.bat

rem now run the batch file to set the env var and run the verpatch command
cmd /C set_version.bat
rem delete the batch file
del set_version.bat

rem call node-resourcehacker once just to ensure binaries are installed
node -e "var resourceHacker = require('node-resourcehacker');resourceHacker({operation: 'addoverwrite',input: '',output: '',resource: '',resourceType: 'ICONGROUP',resourceName: 'MAINICON'}, (err) => {});">NUL

rem use installed resourcehacker binary to add the icon to a temp exe
node_modules\node-resourcehacker\ResourceHacker.exe -open %1 -save %1 -action addoverwrite -res ui\public\favicon.ico -log NUL -mask ICONGROUP,MAINICON,

