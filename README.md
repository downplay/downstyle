# downstyle v0.1.1

## Minimal dependency theming system for React component authors

> ## downstyle *adjective*
> 
> 1. *(typography, capitalization)* Which only capitalizes words (e.g. in headers) that would be capitalized in a normal sentence.

## Intro

While building [Downright](https://github.com/downplay/downwrite) I realised I would need to provide a way for other users of the component to customise how it looked. As a component author you will always want to provide a decent default look and feel so the component "just works" right out of the box; but as we all know, once we encounter real-life concerns, no component is ever going to be "just right" as-is. The font needs to change, the colours are wrong, basically you might have heard of this thing called "branding".

Unfortunately React, despite being great at a great many things, doesn't really have a comprehensive approach to this; there are numerous systems to deal with it, and component authors use a lot of different approaches.

Of course this is a problem that has been solved by CSS since forever. You can ship your component with a stylesheet and use BEM classnames, and a developer can use global CSS to target any element they wish. This certainly gives a lot of flexibility, but is it good enough, and is it even the right approach?

Importantly, you want to leave control in the hands of your consumers: there are big advantages to using the hashed classNames that many React styling systems provide. Some users might prefer to just use inline styles. And there is another, harder, requirement that comes up now and again: what if the user needs to customise the actual HTML output of your component? CSS can sometimes solve this in a very rudimentary fashion with pseduo-elements like `::before` and `::after`, but sometimes requirements go beyond this. Some authors might provide additional wrapping elements to allow more complex styling, but this bloats your component. And failing that, your only solution is to fork the component and alter its rendering, or just roll your own version from scratch.

Downstyle is a system which will overcome all of these problems, allowing you to author components in such a way that the rendering and styling can be customised in *granular* detail.

## Example

For a simple example we'll look at a very basic "FormField" component. It's a simple wrapper around a label and a text input. It might look something like this:

```jsx
const FormField = ({className, children, id, ...others}) => (
    <div className={className}>
        <label for={id}>{children}</label>
        <input id={id} type="text" {...others}></input>
    </div>
);
```

Well, this isn't too bad - we can pass in a class, and target the inner elements with `.className > input`. But, this seems fragile. A later version of the component might change its internal structure and break our style.

Unfortunately, what happened next was my designer spent a week coming up with a truly beautiful design for this component, and we realised we needed an extra wrapping div around both the label and the input.

Downstyle provides a pretty simple helper method.

```jsx
import { themed } from "downstyle";
// Default rendering blocks
const defaultWrapper = ({children, ...others}) => <div {...others}>{children}</div>;
const defaultLabel = ({children, ...others}) => <label {...others}>{children}</label>;
const defaultInput = ({children, ...others}) => <input {...others}>{children}</input>;
class FormField extends Component {
    render() {
        const { theme, id, ...others } = props;
        if (!this.WrapperElement) {
            // Apply theme for each block
            this.WrapperElement = themed(defaultWrapper, theme, "wrapper");
            this.LabelElement = themed(defaultLabel, theme, "label");
            this.InputElement = themed(defaultInput, theme, "input");
        }
        const { WrapperElement, LabelElement, InputElement } = this;
        return (
            <WrapperElement>
                <LabelElement for={id}>{children}</LabelElement>
                <InputElement id={id} type="text" {...others} />
            </WrapperElement>
        );
    }
}
```

`themed` is a very simple wrapper (HOC) designed to be used around simple components - ones doing very little except emitting HTML components, i.e. presentational components. It takes anything passed in by the theme (an object consisting of `classNames`, `styles`, and `elements`), merges it together based on the name(s) provided, and hands you back new presentational components that can be customised.

The themed() helper itself is pretty small and adds minimal weight to your component. There are no additional external dependencies.

Note, the components must be created once and then re-used. Not doing so (i.e. creating them again on each Render method) is bad for performance and will actually break transitions, as React can't tell they're the same elements it creates all the DOM again from scratch.

However this means that your component won't respond if the theme is changed, so you should check for this in componentWillReceiveProps:

```javascript
    componentWillReceiveProps(nextProps) {
        if (nextProps.theme !== this.props.theme) {
            this.WrapperElement = null;
            this.LabelElement = null;
            this.InputElement = null;
        }
    }
```

There is an annoying amount of boilerplate here; in a future version an additional HOC will be provided to make it easier to get the themed elements into your component. However it's still a pretty small amount of boilerplate for a huge gain in functionality!

Let's see what a developer can now do with the component, do help her/his CSS designers:

```jsx
import { FormField } from "react-form-stuff";
import myFormStyles from "./MyFormField.css";
const theme = {
    elements: {
        label: (props) => {
            <div className={myFormStyles.labelWrapper}>
                <label {...props} className={myFormStyles.label} />
            </div>
        },
        input: (props) => {
            <div className={myFormStyles.inputWrapper}>
                <input {...props} className={myFormStyles.input} />
            </div>
        }
    }
}

const MyFormField = ({...props}) => {
    <FormField theme={theme} {...props} />
}

export default MyFormField;

```

So here, we've completely taken over the rendering of these two components, using our own CSS module which our designer created, yet retaining any and all functionality that might be baked into the form field by passing along {...props}. Of course instead of this, I could have done something like use styled.div`` from styled-components to render these elements.

Let's look at another scenario and how we might approach that. We'll add some new functionality to our FormField: it now has render states for `focus`, `success`, and `error`. I'm going to rewrite the original component a little bit, so it uses its own CSS modules:

```jsx
import classNames from "./FormField.css";
class FormField extends Component {
    onFocus() {
        this.setState({focus: true});
    }
    onBlur() {
        this.setState({focus: false});
    }
    render() {
        const {children, id, success, error, ...others} = this.props;
        const {focus} = this.state;
        return (
            <div className={`${classNames.wrapper} ${focus?classNames.focus:""} ${error?classNames.error:""} ${success?classNames.success:""}`}>
                <label for={id} className={classNames.label}>{children}</label>
                <input id={id} className={classNames.input} type="text" {...others} onFocus={this.onFocus} onBlur={this.onBlur}></input>
            </div>
        );
    }

);
```

I won't show the whole CSS, but you can imagine things like:

```css
.wrapper.focus {
    background: lightblue;
}

.wrapper.error {
    background: lightred;
}

.wrapper.error > .input {
    border: 2px solid red;
}
```

We can also do nice transitions between these states.

Now to support theming, we have a lot of classNames to juggle! Also if we want to support inline styles, we have loads of style objects to merge together, various classNames to conditionally concatenate, and we haven't even supported passing in a normal className prop for per-field variations.

Luckily, downstyle has a really simple solution for this. When creating your themed elements, there is a 4th parameter called "mapPropsToTheme". This enables exactly this kind of scenario. The new component would be rewritten as follows:

```jsx
import { themed } from "downstyle";
// Default theme
import classNames from "./FormField.css";
const defaultTheme = { classNames };
// Default rendering blocks
const defaultWrapper = ({children, ...others}) => <div {...others}>{children}</div>;
const defaultLabel = ({children, ...others}) => <label {...others}>{children}</label>;
const defaultInput = ({children, ...others}) => <input {...others}>{children}</input>;
class FormField extends Component {
    static defaultProps = {
        theme: defaultTheme
    }

    render() {
        if (!this.WrapperElement) {
            // Apply theme for each block
            const mapPropsToTheme = (prefix = "") => ({
                focus: `${prefix}focus`,
                success: `${prefix}success`,
                error: `${prefix}error`
            });
            this.WrapperElement = themed(defaultWrapper, theme, "wrapper", mapPropsToTheme());
            this.LabelElement = themed(defaultLabel, theme, "label", mapPropsToTheme("label--"));
            this.InputElement = themed(defaultInput, theme, "input", mapPropsToTheme("error--"));
        }
        const { theme, success, error, ...others } = props;
        const { focus } = this.state;
        const states = { focus, success, error };
        const { WrapperElement, LabelElement, InputElement } = this;
        return (
            <WrapperElement {...states}>
                <LabelElement {...states} for={id}>{children}</LabelElement>
                <InputElement {...states} id={id} type="text" {...others} onFocus={this.onFocus} onBlur={this.onBlur} />
            </WrapperElement>
        );
    }
}
```

Now, with very little code added, we have some powerful new functionality - the entire component can be modified freely depending on its current state.

This is the basic intro. If you find this useful, please let me know, and especially if find there are any requirements not covered by this system.

For more examples of this being used in production, see the "Styling" example in Downright, where the menus are being customised using this system: https://github.com/downplay/downright/blob/master/examples/source/examples/Styling.jsx

## Version History

### 0.1.1

- Properties specified in mapPropsToTheme are no longer passed to the rendered element
- TODO: In some cases might an author might want these props available? Maybe add an option for this.

### 0.1.0

- First release

## Copyright

&copy;2017 Downplay Ltd

Distributed under MIT license. See LICENSE for full details.
