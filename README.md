# ElevenVR Live Scoreboard
Live scoreboard for the ElevenVR Table Tennis game, useful for streamers.

![image](https://user-images.githubusercontent.com/1384885/117728875-531ff900-b1ea-11eb-99ce-4bf4f6f7642b.png)


[![image](https://user-images.githubusercontent.com/1384885/117722672-a5a8e780-b1e1-11eb-9975-9155c081cb4d.png)](https://cristy94.github.io/eleven-vr-scoreboard/)

# How to use

1. Open this page: **https://cristy94.github.io/eleven-vr-scoreboard/**
2. Enter the userID (can be found by clicking on the UserID label, searching for the username and copying the ID showin in the URL)
3. The latest match of that user is displayed and the score is refreshed every 3 seconds.


## Usage with OBS

You can overlay the scoreboard over your stream, it will always show the score of the current match that you are playing.

1. Add a new "Browser" source
2. Point the URL to the scoreboard, setting the userID in the `?user=1234` query parameter, like this:

https://cristy94.github.io/eleven-vr-scoreboard/?user=1234

 ![image](https://user-images.githubusercontent.com/1384885/117724984-cd4d7f00-b1e4-11eb-9d2f-63a90de5a0bc.png)
3. Resize and crop the browser area (you can crop by dragging resize handles while holding ALT).


## Planned features

1. Manually set a delay score update (if video stream is delayed, to not spoil the result)
2. Directly search for the username/userID in the scoreboare
3. Improved design and different themes.
