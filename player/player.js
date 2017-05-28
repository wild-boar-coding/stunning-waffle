const css = /* @css */`
  :host {
    display: inline-block;
    width: 100%;
    height: 100%;
    position: relative;
  }

  .marker-screen {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;

    /* FIXME: remove */
    /*pointer-events: none;*/
  }

  ::slotted(video) {
    width: 100%;
  }

  .marker-screen div {
    width: 50px;
    height: 50px;
    background: red;
    border-radius: 15px;
    position: absolute;
    transform: translate(-50%, -50%);
    transition: top 300ms linear, left 300ms linear;
  }

  .marker-screen.slo-mo div {
    transition-duration: 900ms;
  }
`

const template = /* @html */`
  <style>
    ${css}
  </style>

  <slot></slot>
  <div id="markers" class="marker-screen">

  </div>
`

class AugmentedVideo extends HTMLElement {
  constructor() {
    super()
    this.root = this.attachShadow({ mode: 'open' })
    this.root.innerHTML = template

    const config = this.getAttribute('config')
    this.configReady = fetch(config).then(r => r.json()).then(data => {
      this.config = {
        ...data,
        markers: data.markers.map(m => ({
          ...m,
          startTime: m.coords[0].t,
          endTime: m.coords.slice(-1)[0].t
        }))
      }
    })

    this.markersEl = this.root.getElementById('markers')

    // bind of async methods
    this.update = this.update.bind(this)
    this.render = this.render.bind(this)
  }

  connectedCallback() {
    this.video = [...this.root.querySelector('slot').assignedNodes()]
        .find(el => el.tagName === 'VIDEO')
    this.initPlayer(this.video)
  }

  initPlayer(video) {
    this.markersEl.addEventListener('mouseenter', () => {
      this.markersEl.classList.add('slo-mo')
      this.video.playbackRate = 0.3
    })
    this.markersEl.addEventListener('mouseleave', () => {
      this.markersEl.classList.remove('slo-mo')
      this.video.playbackRate = 1
    })

    this.configReady.then(() => {
      video.addEventListener('play', () => {
        this._videoIsRunning = true
        this.update()
        this.render()
      })
      video.addEventListener('pause', () => {
        this._videoIsRunning = false
      })
    })
  }

  update() {
    let wait = false
    const updateFn = () => {
      // NOTE: We don't need to run this on every single frame - a granularity of decimals would do
      if (wait) return requestAnimationFrame(updateFn)
      wait = setTimeout(() => {
        wait = false
      }, 10)

      // TODO: Calc current and next marker coords
      this.currentMarkerCoords = null
      const currentTime = parseFloat(this.video.currentTime.toFixed(1))
      this.currentMarker = this.config.markers
          .find(m => currentTime >= m.startTime && currentTime < m.endTime)
      if (this.currentMarker) {
        this.currentMarkerCoords = this.currentMarker.coords.find(c => c.t === currentTime)
      }

      if (this._videoIsRunning) requestAnimationFrame(updateFn)
    }
    updateFn()
  }

  render() {
    // TODO: Multiple markers
    if (this.currentMarker) {
      if (this.currentMarkerCoords) {
        let activeMarker = this.markersEl.querySelector(`#${this.currentMarker.id}`)
        const { x, y } = this.currentMarkerCoords
        if (!activeMarker) {
          activeMarker = document.createElement('div')
          this.markersEl.appendChild(activeMarker)
          activeMarker.id = this.currentMarker.id
        }
        activeMarker.style.top = `${y}px`
        activeMarker.style.left = `${x}px`
      }
    } else {
      [...this.markersEl.children].forEach(el => el.remove())
    }

    if (this._videoIsRunning) requestAnimationFrame(this.render)
  }
}

customElements.define('augmented-video', AugmentedVideo)
