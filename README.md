# MMM-ChatGPT

This is a module for [MagicMirror²](https://github.com/MichMich/MagicMirror/).

It fetches a response from ChatGPT using a configurable prompt at a configurable interval.

### Prerequisites

You need a paid [OpenAI](https:://platform.openai.com) account to be able to use this module.<br>
At the time of writing this, the pricing is 0.002 per 1000 tokens, ~750 words (including prompt and response).
For occasional requests, this is practically free, but you still need to set a payment method.
You can, however, set a monthly limit to prevent accidental charges.<br>
Once you have set up your account, generating API keys is possible in your user settings.<br>


### Installation

Navigate into your MagicMirrors modules folder:

```shell
cd ~/MagicMirror/modules
```
Clone this repository:
```shell
git clone https://github.com/ImanuelBertrand/MMM-ChatGPT.git
```

Add the following minimum configuration block to the modules array in the `config/config.js` file and adjust it to your liking:
```js
{
    module: 'MMM-ChatGPT',
    position: 'bottom_bar',
    config: {
        apiKey: '[Your API Key]',
    }
},
```

## Configuration

| Option               | Description                                                                                                                        |
|----------------------|------------------------------------------------------------------------------------------------------------------------------------|
| `apiKey`             | Your API key, see prerequisites                                                                                                    |
| `updateInterval `    | Refresh interval in seconds <br>**Type:** `int` <br>Default `900` = 15 minutes                                                     |
| `animationSpeed `    | Speed of the update animation in seconds <br>**Type:** `int` <br>Default `1`                                                       |
| `initialDelay`       | Delay before first update in seconds. Useful if the prompt needs to fetch data from the screen.<br>**Type:** `int` <br>Default `0` |
| `initialPrompt`      | The initial setup prompt. See examples. <br>**Type:** `string` <br>Default `[]` (None)                                             |
| `prompts`            | The prompts to use. See examples. <br>**Type:** `string` <br>Default `[]` (None)                                                   |
| `loadingPlaceholder` | The placeholder text to show while the request is loading <br>**Type:** `string` <br>Default `Loading ...`                         |
| `model`              | The OpenAI model to use <br>**Type:** `string` <br>Default `gpt-3.5-turbo`                                                         |
| `endpoint`           | The endpoint to use <br>**Type:** `string` <br>Default `https://api.openai.com/v1/chat/completions`                                |
| `timeout`            | Timeout in seconds <br>**Type:** `int` <br>Default `5`                                                                             |
| `retryDelay `        | Retry interval in seconds, in case the request fails <br>**Type:** `int` <br>Default `1`                                           |
| `fontURL`            | Font URL to use for the text <br>**Type:** `string` <br>Default `''` (None, use system default)                                    | 
| `fontSize`           | CSS font size <br>**Type:** `string` <br>Default `''` (None, use system default)                                                   |
| `fontStyle`          | CSS font style <br>**Type:** `string` <br>Default `''` (None, use system default)                                                  |
| `color`              | CSS font color <br>**Type:** `string` <br>Default `''` (None, use system default)                                                  |
| `className`          | Class names to assign to the output<br>**Type:** `string` <br>Default `light small`                                                |

### Advanced usage
If you define more than one prompt, the module will select one at random.<br>
The inital prompt will be prefixed to the regular prompt.
All prompts (both initial and regular) can contain code using `{{code}}` syntax. The code will be evaluated and replaced with the result. This allows you to fetch data from the screen and use it in the prompt. The code is evaluated in the context of the MagicMirror window, so you can use all the DOM API and other browser APIs.<br>

### Security warning
This module will, if configured to do so, execute code defined in the configuration.<br>
This is intentional and not a bad thing, but (as always) be careful when copying code from the internet. 

### Example
This example relies on different modules to be present on the screen (1x time, 3x weather). <br>It fetches the current weather, the weather for later today and the weather for the coming days and uses it in the prompt. It also uses the `initialPrompt` to set up the prompt with the current weather data.

    {
        module: 'MMM-ChatGPT',
        position: 'bottom_bar',
        config: {
            color: 'white',
            apiKey: '[API KEY]',
            updateInterval: 60 * 60,
            initialDelay: 1,
            initialPrompt: [{
                role: "system",
                content: "This is the current time: '{{document.querySelectorAll('.clock')[0].innerText}}'." +
                    "This is the current weather including the time of sunset/sunrise: '{{document.querySelectorAll('.weather')[0].innerText}}'. " +
                    "This is the weather for later today: '{{document.querySelectorAll('.weather')[1].innerText}}'. " +
                    "This is the weather for the coming days: '{{document.querySelectorAll('.weather')[2].innerText}}'. " +
            }],
            prompts: [
                [{
                    role: "user",
                    content: "Make a joke."
                }],
                [{
                    role: "user",
                    content: "Describe the current weather data in a slightly amusing way. Don't use more than one sentence."
                }],
                [{
                    role: "user",
                    content: "Describe the current weather in the style of the Wee Free Men from the novels of Terry Pratchett, but don't mention any specific names from the novels."
                }],
            ]
        }
    },