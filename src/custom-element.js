export { tmpl, } from './deps.js'
import { wire, } from './deps.js'

// builds a wired custom-element from a string template
//
export let customElement = (
    template,
    {
        _wires = {},
        _formAssociated = true,
        ...context
    } = {},

    // needed classes for testing
    {
        HTMLElement = globalThis.HTMLElement,
        document = globalThis.document,
    } = {},
) => {

    return class extends HTMLElement {
        static formAssociated = _formAssociated

        constructor() {
            super()
            this.template_ = template
            this.context_ = context
            this.wiresConfig = _wires
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
            t.innerHTML = template.build(this.context_)
            r.appendChild(t.content.cloneNode(true))
            t = null

            this.wires_ = wire(r, this.wiresConfig, {
                thisObj: this.context_,
            })
            this.this = this.wires_.this
        }
    }
}
