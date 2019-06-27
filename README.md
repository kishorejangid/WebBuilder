WebBuilder
==========

Web Builder 10.0 is an **Prototype** for OpenText Content Server 10.0 Builder Tool Replacement. It can be used to view the **OScript** modules source code from any browser supporting HTML 5.

Features
--------
> - Viewing OScript Code from Content Server Web Interface.
> - Multi Tab Interface
> - Exporting OSpace
> - Viewing Modules installed on Content Server.
> - Executing a particular OScript Function from Web.
> - Editing Module OSpace

> **Note:**
>
> - Currently editing of source code is only supported when the Builder Tool is running on the back end server.

Supported Browsers
-----------------

> - Microsoft Internet Explorer 10 & above
> - Google Chrome
> - Mozilla Firefox

If you try to install on Content Server > 10.0, make sure to update kernel dependency in the webbuilder.ini file

```
[dependencies]
requires_1={'kernel',16,2}
```

Screen Shots Samples
--------------------

![Web Builder](/ScreenShots/WebBuilder.png "Content Server Web Builder")


