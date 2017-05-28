const css = `

`

const template = /* @html */`
  <style>
    ${css}
  </style>

  <slot></slot>
`

class AugmentedVideo extends HTMLElement {
  constructor() {
    super()
    this.root = this.attachShadow({ mode: 'open' })
    this.root.innerHTML = template
  }

  connectedCallback() {
    console.log(this.root.querySelector('video'))
  }
}

customElements.define('augmented-video', AugmentedVideo)
