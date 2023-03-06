/* Magic Mirror
 * Module: MMM-ChatGPT
 *
 * MIT Licensed.
 */

Module.register("MMM-ChatGPT", {

    // Default module config.
    defaults: {
        updateInterval: 900, // seconds
        animationSpeed: 1, // seconds
        initialDelay: 0, // seconds
        initialPrompt: [],
        retryDelay: 1, // seconds

        loadingPlaceholder: "Loading...",

        model: "gpt-3.5-turbo",
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: '',
        timeOut: 5, // seconds

        fontURL: "",
        fontSize: "",
        fontStyle: "",
        color: "",
        className: "light small",

    },

    requiresVersion: "2.1.0", // Not tested on earlier versions than 2.22.0

    start: function () {
        Log.info("Starting module: " + this.name);
        this.updateTimer = null;
        this.message = false;
        this.scheduleNextCall(this.config.initialDelay);
    },

    /* suspend()
     * Stop any scheduled update.
     */
    supend: function () {
        this.updateTimer = null;
    },

    /* resume()
     * Immediately fetch new data, will automatically schedule next update.
     * TODO: Improve by checking when the last response was fetched and only fetch if
     *       the updateInterval has passed.
     */
    resume: function () {
        this.getData();
    },

    /* getPrompt()
     * Assembles the prompt for the API call
     * If multiple prompts are defined, one is chosen at random
     * The initial prompt is prepended to the chosen prompt
     */
    getPrompt: function () {
        let prompts = this.config.prompts;
        let len = prompts.length;
        let prompt = JSON.parse(JSON.stringify(prompts[Math.floor(Math.random() * len)]));
        let initialPrompt = JSON.parse(JSON.stringify(this.config.initialPrompt));
        prompt = initialPrompt.concat(prompt);

        for (let msg of prompt) {
            let content = msg.content;
            let replacements = content.matchAll(/\{\{([^{}]+)\}\}/g)
            for (let m of replacements) {
                content = content.replace(m[0], eval(m[1]));
            }
            msg.content = content;
        }
        return prompt;
    },

    /* getDom()
     * Construct the DOM for the module.
     */
    getDom: function () {
        let wrapper = document.createElement("div");

        for (let key of ["fontURL", "fontSize", "fontStyle", "color"]) {
            if (this.config[key] !== "") {
                wrapper.style[key] = this.config[key];
            }
        }

        if (!this.config.apiKey) {
            wrapper.innerHTML = "Missing API key";
        } else if (this.message) {
            wrapper.innerHTML = this.message;
        } else {
            wrapper.innerHTML = this.config.loadingPlaceholder;
        }

        return wrapper;
    },

    /* getData()
     * Call endpoint, process response and schedule next update.
     */
    getData: function () {
        let request = new XMLHttpRequest();
        request.open("POST", this.config.endpoint, true);
        request.setRequestHeader("Authorization", "Bearer " + this.config.apiKey);
        request.setRequestHeader("Content-Type", "application/json");
        request.timeout = this.config.timeOut * 1000;

        let self = this;
        request.onerror = function () {
            Log.error("ChatGPT API request failed");
            self.scheduleNextCall(self.config.retryDelay);
        }
        request.onabort = function () {
            Log.error("ChatGPT API request aborted");
            self.scheduleNextCall(self.config.retryDelay);
        }
        request.ontimeout = function () {
            Log.error("ChatGPT API request timeout");
            self.scheduleNextCall(self.config.retryDelay);
        }
        request.onload = function () {
            let success = this.status === 200
                ? self.processResponse(this.response)
                : false;

            if (success) {
                self.scheduleNextCall(self.config.updateInterval);
            } else {
                Log.error("ChatGPT API response: " + this.status + ": " + this.response);
                if (this.status === 401) {
                    self.message = "[401 Unauthorized, check your API key]";
                    self.updateDom(self.config.animationSpeed * 1000);
                    self.updateTimer = null;
                    return;
                }
                self.scheduleNextCall(self.config.retryDelay);
            }
        };

        let payload = {
            "model": self.config.model,
            "messages": this.getPrompt()
        };

        request.send(JSON.stringify(payload));
    },

    /* processResponse(response)
     * Process the response from the API.
     * Returns true if the response is valid, false otherwise.
     */
    processResponse: function (response) {
        let data;
        try {
            data = JSON.parse(response);
        } catch (e) {
            Log.error("ChatGPT API response is not valid JSON: " + response);
            return false;
        }

        if (!("choices" in data)
            || data.choices.length === 0
            || !("message" in data.choices[0])
            || !("content" in data.choices[0].message)
        ) {
            return false;
        }

        let message = data.choices[0].message.content;

        // ChatGPT sometimes likes to return a quoted string
        if (message.startsWith('"') && message.endsWith('"')) {
            message = message.replaceAll(/^["\s]+|["\s]+$/g, "");
        }

        this.message = message;
        this.updateDom(this.config.animationSpeed * 1000);
        return true;
    },

    /* scheduleNextCall(seconds)
     * Schedule next update.
     */
    scheduleNextCall: function (seconds) {
        clearTimeout(this.updateTimer);
        let self = this;
        this.updateTimer = setTimeout(() => self.getData(), seconds * 1000);
    },
});
