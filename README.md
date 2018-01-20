# sunrise

### Sunrise Simulation for TP-Link Kasa color lightbulbs with web interface using node.js.

Apparently there's [science](https://en.wikipedia.org/wiki/Dawn_simulation) that says that
sunrise is a healthy way to wake up. If your boss won't let you schedule your day around the
sun, you need this.
 
<a href="https://youtu.be/u5jpNrPbcPU" target="_blank">
<img src="youtube.jpg" alt="Sunrise Simulation Demo" width="480" height="270" border="10" /></a>

Get the TP-Link [LB-130s](https://www.amazon.com/gp/product/B01HXM8X88/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B01HXM8X88&linkCode=as2&tag=alwynallan-20&linkId=0825859a7e932fd942ae1dfbac590114)
configured and named on the LAN with the Kasa app. Update firmware.
[LB-230s](https://www.amazon.com/gp/product/B072N7GG9K/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B072N7GG9K&linkCode=as2&tag=alwynallan-20&linkId=f74cb1f11989a4c79f8cf2e0e1e1a155)
should work, but have not been tested. This should work with node and npm on an
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