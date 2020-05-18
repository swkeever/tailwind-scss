# Libraries

- [Tailwind CSS](https://tailwindcss.com/)
- [Normalize.css](https://necolas.github.io/normalize.css/)
- [include-media](https://github.com/eduardoboucas/include-media)

## Tailwind CSS

We've extracted the properties Tailwind CSS uses in their utility classes. _For the most part_ you can access the property with the property name. For example

```scss
body {
  color: color($gray, 100);
}
```

I've categorized the files in `src/lib/tailwind/` to be reflective of how they are categorized in Tailwind's documentation. You can either look at the individual files or refer to [Tailwind's documentation](https://tailwindcss.com/) to see which values are valid.
