import { assert, parseHTML, } from './deps.js'
import { tmpl, customElement, } from '../mod.js'

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

customElements.define('custom-element', customElement(
    tmpl`<form><button>${function(msg) { return msg }}</button></form>`,
    {
        _attributes: {
            foo:function(value) {
                var ev = new CustomEvent('foo_changed', {detail:{ value}})
                this.this.trigger_(ev)
            },
        },

        _wires: {
            '.': {
                connected: function() {
                    this.connected = true
                },

                disconnected: function() {
                    this.disconnected = true
                },

                attribute_changed: function({attribute, newValue, oldValue}) {
                    this.attributeChanged = true
                },
            },

            'button': {
                _id: 'button',
                click: function(ev) {
                    this.buttonClicked++
                },

                direct_event: function(ev) {
                    this.directValue=ev.detail
                },

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
            this.button.click() // calls button clicked
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
    assert(el.shadowRoot.innerHTML === '<form><button>foo</button></form>')

    // connected
    //
    assert(el.this.connected)

    // update template
    //
    el.build({msg:'bar'})
    assert(el.shadowRoot.innerHTML === '<form><button>bar</button></form>')
    assert(el.this.msg==='bar')


    // call method in scope
    //
    el.this.foo()
    assert(el.this.buttonClicked===1)

    // to target listeners of special type
    //
    var ev = new CustomEvent('direct_event', {detail:'world'})
    el.this.trigger_(ev )
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