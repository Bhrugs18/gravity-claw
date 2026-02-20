#!/usr/bin/expect -f
set timeout 10
spawn railway login
expect "Open the browser?"
send "n\r"
expect eof
