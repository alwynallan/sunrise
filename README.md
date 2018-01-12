# sunrise

Sunrise Simulation for TP-Link Kasa color lightbulbs with web interface using node.js.

Get the TP-Link LB-130s configured and named on the LAN with the Kasa app. Update firmware.
LB-230s should work, but have not been tested. This should work with node and npm on an
always-on Windows machine, but that has not been tested. E-mail alwynallan@gmail.com with info.

Requires some node.js packages:
```
        $ npm install node-cron
        $ npm install node-persist
        $ npm install tplink-smarthome-api
```
Note that node-persist requires user write permission in the working directory.

Try
```
        $ node master.js
```
then configure at [http://localhost:8000/]

To install permanently use
```
       $ sudo npm install -g forever
       $ crontab -e
```
And add the lines
```
       SP=[Path]
       @reboot /usr/local/bin/forever start --workingDir $SP $SP/master.js
```
Then test
```
        $ sudo reboot
```

[http://localhost:8000/]: http://localhost:8000/