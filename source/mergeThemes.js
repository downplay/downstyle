function mergeThemes(theme1, theme2) {
    // Clone theme 1 classes
    const classNames = { ...theme1.classNames };
    // Clone theme 1 styles (shallow)
    const styles = { ...theme1.styles };
    // Merge in theme 2
    Object.keys(theme2).forEach(name => {
        // Append classNames
        classNames[name] = classNames[name] ? `${classNames[name]} ${theme2.className[name]}` : theme2.className[name];
        // Merge style props to new object
        styles[name] = styles[name] ? {...styles[name], ...theme2.styles[name]} : theme2.styles[name];
    });
    // Put the theme together
    return {
        classNames,
        styles,
        // Elements 
        elements: { ...theme1.elements, ...theme2.elements }
    }
}