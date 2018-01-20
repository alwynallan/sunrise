# sunrise

### Sunrise Simulation for TP-Link Kasa color lightbulbs with web interface using node.js.

Apparently there's science that says that sunrise is a healthy way to wake up. If your boss
 won't let you schedule your day around the sun, you need this.
 
<a href="http://www.youtube.com/watch?feature=player_embedded&v=u5jpNrPbcPU
" target="_blank"><img src="http://img.youtube.com/vi/u5jpNrPbcPU/0.jpg" 
alt="Sunrise Simulation Demo" width="640" height="315" border="10" /></a>

<iframe width="560" height="315" src="https://www.youtube.com/embed/u5jpNrPbcPU?rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

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
then configure at [http://localhost:8000/](http://localhost:8000/) with a UI like this

![User Interface](/Settings.5.png)

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