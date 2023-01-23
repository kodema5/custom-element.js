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
        _wires: {
            'button': {
                _id: 'button',
                click: function(ev) {
                    this.buttonClicked++
                },

                'direct-event': function(ev) {
                    this.directValue=ev.detail
                }
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
    },
))

Deno.test('custom element', () => {
    // build template
    //
    let el = document.body.querySelector('custom-element')
    assert(el.shadowRoot.innerHTML === '<form><button>foo</button></form>')

    // update template
    //
    el.build({msg:'bar'})
    assert(el.shadowRoot.innerHTML === '<form><button>bar</button></form>')

    // call method in scope
    //
    el.this.foo()
    assert(el.this.buttonClicked===1)

    // to target listeners of special type
    //
    var ev = new CustomEvent('direct-event', {detail:'world'})
    el.this.trigger_(ev )
    assert(el.this.directValue==='world')
})