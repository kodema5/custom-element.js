import { assert, parseHTML, } from './deps.js'
import { tmpl, wireElement, } from '../mod.js'

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
        <div id="root"></div>
    </body>
    </html>`)


let el = wireElement(
    document.getElementById('root'),
    tmpl`<form><button>${function(msg) { return msg }}</button></form>`,
    {
        _wires: {
            '.': {
                direct_event: function(ev) {
                    this.msg = ev.detail
                    // rebuild template
                    this.build_()
                }
            },

            'button': {
                _id: 'button',
                click: function(ev) {
                    this.buttonClicked++
                },
            }
        },
        buttonClicked: 0,
        msg: 'hello'
    },

    // passed for testing in deno
    {
        HTMLElement,
        document,
        CustomEvent,
    },
)

Deno.test('wire element', () => {
    // has button
    assert(el.this.button)

    // renders with msg
    assert(el.root.innerHTML.indexOf('<button>hello</button>')>=0)

    // captures event
    var ev = new CustomEvent('direct_event', {detail:'world', bubble:true})
    el.fire(ev)
    assert(el.this.msg == 'world')

    assert(el.root.innerHTML.indexOf('<button>world</button>')>=0)

    // has button still
    assert(el.this.button)
})