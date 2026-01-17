/*
 * Copyright (c) 2026 Ayon Sarkar. All Rights Reserved.
 *
 * This source code is licensed under the terms found in the
 * LICENSE file in the root directory of this source tree.
 *
 * USE FOR EVALUATION ONLY. NO PRODUCTION USE OR COPYING PERMITTED.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: 'media',
}
