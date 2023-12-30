export class CustomPlayer {
  defaultOptions = {
    isMuted: () => { },
    isEnded: () => { },
    isPlay: () => { },
    isPause: () => { },
    modClass: '',
    initialVolume: 0.5,
  }

  constructor(selector, options) {
    this.selector = selector;
    // this.options = {...this.defaultOptions, ...options};
    this.options = Object.assign(this.defaultOptions, options);
    this.video = document.querySelector(this.selector);
    this.parent = null;
    this.elements = {};
    this.dragTimeline = false;
    this.dragVolume = false;
    this.playing = false;
    this.muted = false;
    this.volumePanelWidth = 0;
    this.volumeHandlePosition = 0;
    this.volumeHandleDistance = 0;
    this.timelineRect = 0;
    this.timelineWidth = 0;
    this.previousVolume = 0.5;

    this.check();
    this.init();
    this.events();
    this.standardEvents();
  }

  check() {
    if (!this.video) {
      console.log('An element with current a selector does not exist');
      return;
    };

    if (!this.video.getAttribute('src')) {
      console.log('The attribute src is not filled');
      return;
    };
  }

  setAria(element, attr, value) {
    element.setAttribute(attr, value);
  }

  createElements() {
    const wrapper = document.createElement('section');
    wrapper.classList.add('custom-player');
    wrapper.setAttribute('tabindex', 0);
    this.video.setAttribute('tabindex', -1);

    if (this.options.modClass) {
      wrapper.classList.add(this.options.modClass);
    };

    this.video.parentNode.insertBefore(wrapper, this.video);
    wrapper.append(this.video);

    wrapper.insertAdjacentHTML('beforeend', `
      <div class="custom-player__volume-indicator hidden">0%</div>
        <div class="custom-player__controls">
          <div class="custom-player__timeline timeline" tabindex="0" role="slider" aria-label="video slider" aria-valuemin="0" aria-valuemax="" aria-valuecurrent="" aria-valuetext="">
            <div class="timeline__progress"></div>
            <div class="timeline__handle"></div>
          </div>
          <div class="custom-player__main-controls">
            <div class="custom-player__play-controls">
              <button class="custom-player-button custom-player__play-button" type="button" aria-keyshortcuts="k" aria-label="for activation Play press key k">
                <span class="custom-player-btn__icon custom-player-btn__play-icon custom-player__icon--play"></span>
              </button>
            </div>
              <button class="custom-player-button custom-player__volume-button" type="button" aria-keyshortcuts="m" aria-label="for activation Mute press key m">
                <span class="custom-player-btn__icon custom-player-btn__volume-icon custom-player__icon--unmuted"></span>
              </button>
              <div class="custom-player__volume-panel" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuecurrent="" aria-valuetext="" aria-label="Volume">
                <div class="custom-player__volume-panel__slider">
                  <div class="custom-player__volume-panel__handle"></div>
                </div>
              </div>
            </div>
            <div class="custom-player__time-panel">0:00 / 0:00</div>
            <button class="custom-player-button custom-player__fullscreen-button" type="button" aria-keyshortcuts="f" aria-label="for activation Fullscreen press key f">
              <span class="custom-player-btn__icon custom-player-btn__fullscreen-icon custom-player__icon--fullscreen"></span>
            </button>
          </div>
      </div>
    `);
  }

  calculateSize() {
    this.volumePanelWidth = this.elements.volumePanel.offsetWidth;
    this.volumeHandlePosition = this.elements.volumeHandle.offsetWidth;
    this.volumeHandleDistance = this.volumePanelWidth - this.volumeHandlePosition;
    this.timelineRect = this.elements.timeline.getBoundingClientRect();
    this.timelineWidth = this.timelineRect.width;
  }

  findElements() {
    const parent = this.video.closest('.custom-player');
    this.parent = parent;

    this.elements = {
      timeline: parent.querySelector('.timeline'),
      timelineProgress: parent.querySelector('.timeline__progress'),
      timelineHandle: parent.querySelector('.timeline__handle'),
      volumePanel: parent.querySelector('.custom-player__volume-panel'),
      volumeHandle: parent.querySelector('.custom-player__volume-panel__handle'),
      volumeButton: parent.querySelector('.custom-player__volume-button'),
      volumeIndicator: parent.querySelector('.custom-player__volume-indicator'),
      timeDisplay: parent.querySelector('.custom-player__time-panel'),
      playButton: parent.querySelector('.custom-player__play-button'),
      fullscreenButton: parent.querySelector('.custom-player__fullscreen-button'),
      playButtonIcon: parent.querySelector('.custom-player-btn__play-icon'),
      volumeButtonIcon: parent.querySelector('.custom-player-btn__volume-icon'),
    };
  }

  initElements() {
    this.video.addEventListener('loadedmetadata', loadVideoData.bind(this));

    function loadVideoData() {
      const duration = this.video.duration;
      const currentTime = this.video.currentTime;
      const timeAria = {
        valueMax: ['aria-valuemax', Math.floor(duration)],
        valueCurrent: ['aria-valuecurrent', Math.floor(currentTime)],
        valueText: ['aria-valuetext', `${this.formatTime(currentTime, 'dot')} (duration - ${this.formatTime(duration, 'dot')})`],
      };

      this.elements.timeDisplay.textContent = `${this.formatTime(currentTime)} / ${this.formatTime(duration)}`;

      this.setAria(this.elements.timeline, ...timeAria.valueMax);
      this.setAria(this.elements.timeline, ...timeAria.valueCurrent);
      this.setAria(this.elements.timeline, ...timeAria.valueText);

      initVolume.call(this);
    };

    function initVolume() {
      const initVolumeDistance = this.options.initialVolume * this.volumeHandleDistance;
      const volume = (this.options.initialVolume * 100).toFixed(0);
      this.elements.volumeHandle.style.left = `${initVolumeDistance}px`;
      // this.elements.volumeHandle.style.left = `${volume}%`;

      this.setAria(this.elements.volumePanel, 'aria-valuecurrent', volume);
      this.setAria(this.elements.volumePanel, 'aria-valuetext', `Volume - ${volume}%`);
      this.elements.volumeIndicator.textContent = `${volume}%`;
    };
  }

  formatTime(time, format = 'colon') {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    if (format === 'dot') {
      return `${minutes} min : ${seconds} sec`;
    };

    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }

  init() {
    this.video.controls = false;
    this.video.setAttribute('muted', '');
    this.video.setAttribute('playsinline', '');
    this.video.setAttribute('preload', 'metadata');

    this.createElements();
    this.findElements();
    this.calculateSize();
    this.initElements();
  }

  play() {
    this.playing = true;
    this.video.play();
    this.elements.playButton.setAttribute('aria-label', 'for activation Pause press key k');
    this.elements.playButtonIcon.classList.replace('custom-player__icon--play', 'custom-player__icon--pause');
  }

  pause() {
    this.playing = false;
    this.video.pause();
    this.elements.playButton.setAttribute('aria-label', 'for activation Play press key k');
    this.elements.playButtonIcon.classList.replace('custom-player__icon--pause', 'custom-player__icon--play');
  }

  mute() {
    // this.previousVolume = this.video.volume; //use this.elements.volumePanel.getAttribute('aria-valuecurrent');
    this.muted = true;
    this.options.isMuted(this);
    this.video.muted = true;
    this.elements.volumeButton.setAttribute('aria-label', 'for activation Mute press key m');
    this.elements.volumeButtonIcon.classList.replace('custom-player__icon--unmuted', 'custom-player__icon--muted');
  }

  unmute() {
    this.muted = false;
    this.video.muted = false;
    this.elements.volumeButton.setAttribute('aria-label', 'for activation Unmute press key m');
    this.elements.volumeButtonIcon.classList.replace('custom-player__icon--muted', 'custom-player__icon--unmuted');
  }

  updateTimelineAria() {
    const currentTime = this.video.currentTime;
    const duration = this.video.duration;

    this.setAria(this.elements.timeline, 'aria-valuemax', duration);
    this.setAria(this.elements.timeline, 'aria-valuecurrent', currentTime);
    this.setAria(this.elements.timeline, 'aria-valuetext', `${this.formatTime(currentTime, 'dot')} (duration - ${this.formatTime(duration, 'dot')})`);
  }

  updateTimeline(e) {
    const clickPositionX = e.clientX - this.timelineRect.left;
    const seekTime = (clickPositionX / this.timelineWidth) * this.video.duration;
    const progressWidth = this.elements.timelineProgress.offsetWidth;
    this.elements.timelineHandle.style.left = `${progressWidth}px`;

    this.video.currentTime = seekTime;
    this.updateTimelineAria();
  }

  enterFullScreen(el) {
    setTimeout(() => {
      this.elements.playButton.focus()
    }, 200);

    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.mozRequestFullScreen) {
      el.mozRequestFullScreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    };
  }

  exitFullScreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      el.msExitFullscreen();
    };
  }

  toggleFullscreen() {
    this.calculateSize();
    if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      this.exitFullScreen();
    } else {
      this.enterFullScreen(this.parent);
    };
  }

  events() {
    window.addEventListener('resize', resizeWindow.bind(this));
    function resizeWindow() {
      this.calculateSize();
    };

    this.video.addEventListener('click', togglePlay.bind(this));
    this.elements.playButton.addEventListener('click', togglePlay.bind(this));
    function togglePlay() {
      if (!this.playing) {
        this.play()
      } else {
        this.pause();
      };
    };

    this.elements.volumeButton.addEventListener('click', toggleMute.bind(this));
    function toggleMute() {
      if (!this.muted) {
        this.mute();
      } else {
        this.unmute();
      };
    };

    this.video.addEventListener('timeupdate', timeLineUpdate.bind(this));
    function timeLineUpdate() {
      const currentTime = this.video.currentTime;
      const duration = this.video.duration;
      const progressWidth = `${(currentTime / duration) * 100}%`;
      this.elements.timelineProgress.style.width = progressWidth;
      this.elements.timelineHandle.style.left = progressWidth;
      // this.elements.timelineHandle.style.transform = `translateX(${translateX})`;
      this.elements.timeDisplay.textContent = `${this.formatTime(currentTime)} / ${this.formatTime(duration)}`;
      this.updateTimelineAria();
    };

    this.elements.timeline.addEventListener('mousedown', mouseDownEvent.bind(this));
    function mouseDownEvent(e) {
      this.dragTimeline = true;
      this.updateTimeline(e);
    };

    document.addEventListener('mousemove', mouseMoveEvent.bind(this));
    function mouseMoveEvent(e) {
      if (this.dragTimeline) {
        this.updateTimeline(e);
      };
    };

    document.addEventListener('mouseup', mouseUpEvent.bind(this));
    function mouseUpEvent(e) {
      if (this.dragTimeline) {
        this.dragTimeline = false;
      };
    };

    this.elements.fullscreenButton.addEventListener('click', function() {
      this.toggleFullscreen();
    }.bind(this));
  }

  standardEvents() {

  }
};