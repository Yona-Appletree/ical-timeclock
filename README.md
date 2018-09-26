# iCal Timeclock Script

Automates the process of creating Timeclock entries from iCal events.

## Installing

1. Set your system time to 24-hour time. "Language and Region" -> "24-Hour Time"
2. Create a bookmarklet with this code: `javascript:$.getScript('https://raw.githubusercontent.com/Yona-Appletree/ical-timeclock/master/ical-timeclock.js`
 
## Usage

Create events in iCal representing your CSky work.

The format for the names of the events is `TICKET: Some Description #project/activity`. 
`TICKET` and `ACTIVITY` are optional. If `ACTIVITY` isn't specified, keywords in the description will be used.

For example `BGR-2576: Work on deployment and documentation #internal: badgr`

`PROJECT` and `ACTIVITY` must be substrings of the labels in the project and activity dropdowns.


[1]:javascript:alert('Hello World')