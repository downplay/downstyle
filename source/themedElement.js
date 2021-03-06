import React from "react";

function mapClassNames(theme, names) {
    return (theme.classNames
        ? names.map(name => theme.classNames[name] || name)
        : names).join(" ");
}

function reduceStyle(base, theme, names) {
    return theme.styles
        ? names.reduce(
              (blockStyle, name) => ({
                  ...blockStyle,
                  ...theme.styles[name]
              }),
              base
          )
        : {};
}

function reduceElement(element, theme, names) {
    return theme.elements
        ? names.reduce((el, name) => theme.elements[name] || el, element)
        : element;
}

export default (element, theme, names, mapPropsToTheme) => {
    const blockNames = typeof names === "string" ? [names] : names;

    // Swap out the element - only last matching provided counts
    // TODO: Would be slightly more performant to reduce the array in reverse
    const baseElement = reduceElement(element, theme, blockNames);

    // Combine class names
    const baseClassName = mapClassNames(theme, blockNames);

    // Merge all styles into one
    const baseStyle = reduceStyle({}, theme, blockNames);

    // The new component will merge any additional className or style provided for us
    return ({ children, ...others }) => {
        let style = baseStyle;
        let className = baseClassName;
        let Element = baseElement;
        if (mapPropsToTheme) {
            const mappedNames = [];
            Object.keys(mapPropsToTheme).forEach(prop => {
                if (Object.hasOwnProperty.call(others, prop)) {
                    // Merge in the extra block if truthy
                    if (others[prop]) {
                        mappedNames.push(mapPropsToTheme[prop]);
                    }
                    // Don't pass prop onto rendered element
                    // eslint-disable-next-line no-param-reassign
                    delete others[prop];
                }
            });
            if (mappedNames.length) {
                className = `${baseClassName} asd ${mapClassNames(
                    theme,
                    mappedNames
                )}`;
                style = reduceStyle(style, theme, mappedNames);
                Element = reduceElement(baseElement, theme, mappedNames);
            }
        }
        return (
            <Element
                {...others}
                className={`${className} ${others.className || ""}`}
                style={{ ...style, ...others.style }}
            >
                {children}
            </Element>
        );
    };
};
