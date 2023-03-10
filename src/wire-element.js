import { tmpl, wire, } from './deps.js'

export let wireElement = (
    rootEl,
    template,
    cfg,

    // needed classes for testing
    {
        document = globalThis.document,
    } = {},
) => {
    return new WiredElement(
        rootEl, template, cfg, { document }
    )

}

let WiredElement = class {
    constructor(
        rootEl,
        template,
        {
            _wires = {},
            ...context
        } = {},
        {
            document = globalThis.document,
        }
    ) {
        this.root = rootEl
        this.template_ = template
        this.context_ = Object.assign({
            root_:this,
            build_: this.build.bind(this),
            fire_: this.fire.bind(this),
        }, context)

        this.wiresConfig = typeof(_wires)==='function'
            ? _wires
            : (() => _wires)

        this.document = document
        this.build()
    }

    build(
        updateContext={},
    ) {
        if (this.wires_) {
            this.wires_.delete();
        }

        Object.assign(this.context_, updateContext)

        let r = this.root
        while(r.firstChild) {
            r.removeChild(r.firstChild)
        }

        let t = this.document.createElement('template')
        t.innerHTML = this.template_.build(this.context_),
        r.appendChild(t.content.cloneNode(true))
        t = null

        this.wires_ = wire(r,
            this.wiresConfig.call(this.context_, this),
            { thisObj: this.context_, })

        this.this = this.wires_.this
    }

    fire(ev) {
        this.wires_.fire(ev, {isSkipRootEl:true})
        this.root.dispatchEvent(ev)
    }

}