import { assert, parseHTML, } from './deps.js'
import { tmpl, customElementDefaults, customElement, } from '../mod.js'

const {
    window,
    document,
    customElements,
    HTMLElement,
    Event,
    CustomEvent
} = parseHTML(`
    <!DOCTYPE html>
    <html lang="en">
    <body>
        <custom-element></custom-element>
    </body>
    </html>`)

// default header/footer for common style/scripts
//
customElementDefaults.header = `
    <style>body { color:#f2f2f2; }</style>
`
customElementDefaults.footer = `
    <div>copyright</div>
`

customElements.define('custom-element', customElement(
    tmpl`<form><button>${function(msg) { return msg }}</button></form>`,
    {
        // overrides customElementDefaults.header
        // _header: 'copyright2',

        // overrides customElementDefaults.footer
        _footer: 'copyright2',

        _attributes: {

            // triggered by attribute changed
            // use this.root_.fire(ev) to publish a wire event
            //
            foo:function(value) {
                var ev = new CustomEvent('foo_changed', {detail:{ value}})
                this.root_.fire(ev)
            },
        },

        _wires: {
            '.': {
                // when first connected for initialization
                //
                connected: function() {
                    this.connected = true
                },

                // for cleanup after element removed
                //
                disconnected: function() {
                    this.disconnected = true
                },

                // when attribute changed
                //
                attribute_changed: function({attribute, newValue, oldValue}) {
                    this.attributeChanged = true
                },
            },

            'button': {
                _id: 'button',

                // listens to button's click
                //
                click: function(ev) {
                    this.buttonClicked++

                    // to dispatch to root from wires
                    //
                    var ce = new CustomEvent('button_clicked', {detail:null})
                    this.root_.fire(ce)
                },

                // triggered by el.fire(....) from outside
                //
                direct_event: function(ev) {
                    this.directValue=ev.detail
                },

                // triggered by attribute changed above
                //
                foo_changed: function(ev) {
                    this.fooValue = ev.detail.value
                },
            }
        },

        buttonClicked: 0,

        msg: 'foo',

        // these are the context (this obj)
        //
        foo: function() {
            this.button.click() // calls button click method
        }
    },

    // passed for testing in deno
    {
        HTMLElement,
        document,
        CustomEvent,
    },
))

Deno.test('custom element', () => {
    // build template
    //
    let el = document.body.querySelector('custom-element')
    assert(el.shadowRoot.innerHTML.indexOf('<form><button>foo</button></form>')>=0)

    // has the default header and footer
    //
    assert(el.shadowRoot.innerHTML.indexOf('<style>body')>=0)
    // overridden
    assert(el.shadowRoot.innerHTML.indexOf('copyright2')>=0)

    // connected
    //
    assert(el.this.connected)

    // update template
    //
    el.build({msg:'bar'})
    assert(el.shadowRoot.innerHTML.indexOf('<form><button>bar</button></form>')>=0)
    assert(el.this.msg==='bar')

    // call method in scope
    //
    el.addEventListener('button_clicked', () => {
        el.isButtonClicked = true
    })
    el.this.foo()
    assert(el.this.buttonClicked===1)
    assert(el.isButtonClicked)

    // to target listeners of special type
    //
    var ev = new CustomEvent('direct_event', {detail:'world', bubble:true})
    el.fire(ev)
    assert(el.this.directValue==='world')

    // capture attribute-change
    //
    el.setAttribute('foo', 'baz')
    assert(el.this.attributeChanged)
    assert(el.this.fooValue === 'baz')

    // check disconnected
    //
    document.body.removeChild(el)
    assert(el.isConnected === false)
    assert(el.this.disconnected)

})