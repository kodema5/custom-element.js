export { tmpl, } from './deps.js'
import { wire, } from './deps.js'

export let customElementDefaults = {
    header: '',
    footer: '',
}

// builds a wired custom-element from a string template
//
export let customElement = (
    template,
    {
        _header = customElementDefaults.header,
        _footer = customElementDefaults.footer,
        _wires = {},
        _attributes = {},
        _formAssociated = true,
        ...context
    } = {},

    // needed classes for testing
    {
        HTMLElement = globalThis.HTMLElement,
        document = globalThis.document,
        CustomEvent = globalThis.CustomEvent,
    } = {},
) => {

    return class extends HTMLElement {
        static formAssociated = _formAssociated

        constructor() {
            super()
            this.template_ = template
            this.context_ = Object.assign({
                root_:this,
                build_: this.build.bind(this),
                fire_: this.fire.bind(this),
            }, context)

            this.wiresConfig = typeof(_wires)==='function'
                ? _wires
                : (() => _wires)

            this.attachShadow({ mode:'open' })
            this.build()
        }

        build(
            updateContext={},
        ) {
            if (this.wires_) {
                this.wires_.delete();
            }

            Object.assign(this.context_, updateContext)

            let r = this.shadowRoot
            while(r.firstChild) {
                r.removeChild(r.firstChild)
            }

            let t = document.createElement('template')
            t.innerHTML = [
                _header,
                template.build(this.context_),
                _footer
            ].filter(Boolean).join('')
            r.appendChild(t.content.cloneNode(true))
            t = null

            this.wires_ = wire(r,
                this.wiresConfig.call(this.context_, this),
                { thisObj: this.context_,})

            this.this = this.wires_.this
        }

        fire(ev) {
            this.wires_.fire(ev)
            this.dispatchEvent(ev)
        }

        connectedCallback() {
            let me = this
            let ev = new CustomEvent('connected', { detail:null })
            me.fire(ev)
        }

        disconnectedCallback() {
            let me = this
            let ev = new CustomEvent('disconnected', { detail:null })
            me.fire(ev)
        }

        adoptedCallback() {
            let me = this
            let ev = new CustomEvent('adopted', { detail:null })
            me.fire(ev)
        }

        static get observedAttributes() {
            return Object.keys(_attributes)
        }

        attributeChangedCallback(name, oldValue, value) {
            let f = _attributes[name]
            if (f && typeof f ==='function') {
                f.call(this.context_, value, oldValue)
            }

            let me = this
            let ev = new CustomEvent('attribute_changed', {
                detail:{name, value, oldValue,}
            })
            me.fire(ev)
        }
    }
}
