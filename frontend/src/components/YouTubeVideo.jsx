// components/YouTubeVideo.jsx
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './YouTubeVideo.css';

let youtubeScriptLoaded = false;
let youtubePlayers = [];

function YouTubeVideo({ width = '640', height = '390', playerVars = {}, events = {} }) {
  const iframeRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [loadingVideoId, setLoadingVideoId] = useState(true);
  const [videoIdError, setVideoIdError] = useState(null);

  useEffect(() => {
    const fetchVideoId = async () => {
      setLoadingVideoId(true);
      setVideoIdError(null);
      try {
        const response = await axios.get('http://192.168.1.100:8000/video_id'); // Replace with your Flask app's URL
        setVideoId(response.data.video_id);
      } catch (error) {
        console.error('Error fetching video ID:', error);
        setVideoIdError('Failed to load video ID.');
      } finally {
        setLoadingVideoId(false);
      }
    };

    fetchVideoId();
  }, []);

  useEffect(() => {
    if (videoId && iframeRef.current) {
      const createPlayer = () => {
        const newPlayer = new window.YT.Player(iframeRef.current, {
          height: height,
          width: width,
          videoId: videoId,
          playerVars: {
            'controls': 1,
            'rel': 0,
            'modestbranding': 1,
            ...playerVars,
          },
          events: {
            'onReady': (event) => {
              console.log('Player ready', event);
              if (events.onReady) {
                events.onReady(event);
              }
            },
            'onStateChange': (event) => {
              console.log('Player state changed', event);
              if (events.onStateChange) {
                events.onStateChange(event);
              }
            },
            ...events,
          },
        });
        setPlayer(newPlayer);
        youtubePlayers.push(newPlayer);
      };

      if (!youtubeScriptLoaded) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = () => {
          youtubeScriptLoaded = true;
          createPlayer();
        };
      } else if (!player) {
        createPlayer();
      }
    }

    return () => {
      if (player) {
        const index = youtubePlayers.indexOf(player);
        if (index > -1) {
          youtubePlayers.splice(index, 1);
          player.destroy();
        }
        setPlayer(null);
      }
    };
  }, [videoId, height, width, playerVars, events]);

  if (loadingVideoId) {
    return <div>Loading video ID...</div>;
  }

  if (videoIdError) {
    return <div>Error loading video ID: {videoIdError}</div>;
  }

  return (

 <div className="youtube-container">
      {videoId && <div ref={iframeRef} id={`youtube-player-${videoId}`} className="youtube-player" />}
    </div>

  );
}

export default YouTubeVideo;