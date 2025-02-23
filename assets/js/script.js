class NoobAPI {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.originalResponse = '';
        this.initializeDefaultHeaders();
    }

    initializeElements() {
        this.methodSelect = document.getElementById('method');
        this.urlInput = document.getElementById('url');
        this.authTokenInput = document.getElementById('authToken');
        this.paramsContainer = document.getElementById('paramsContainer');
        this.headersContainer = document.getElementById('headersContainer');
        this.bodyTypeSelect = document.getElementById('bodyType');
        this.bodyContent = document.getElementById('bodyContent');
        this.responseElement = document.getElementById('response');
        this.filterInput = document.getElementById('filterResponse');
        this.sendButton = document.getElementById('sendRequest');
        this.saveTemplateButton = document.getElementById('saveTemplate');
        this.loadTemplateButton = document.getElementById('loadTemplate');
        this.copyResponseButton = document.getElementById('copyResponse');
        this.addParamButton = document.getElementById('addParam');
        this.addHeaderButton = document.getElementById('addHeader');
    }

    initializeDefaultHeaders() {
        this.addParameterRow(this.headersContainer);
        const contentTypeRow = this.headersContainer.lastElementChild;
        contentTypeRow.querySelector('.key').value = 'Content-Type';
        contentTypeRow.querySelector('.value').value = 'application/json';
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendRequest());
        this.saveTemplateButton.addEventListener('click', () => this.saveTemplate());
        this.loadTemplateButton.addEventListener('change', (event) => this.loadTemplate(event));
        this.copyResponseButton.addEventListener('click', () => this.copyResponse());
        this.addParamButton.addEventListener('click', () => this.addParameterRow(this.paramsContainer));
        this.addHeaderButton.addEventListener('click', () => this.addParameterRow(this.headersContainer));
        this.filterInput.addEventListener('input', () => this.filterResponse());
    }

    addParameterRow(container) {
        const row = document.createElement('div');
        row.className = 'parameter-row';
        row.innerHTML = `
            <input type="text" placeholder="Chave" class="key">
            <input type="text" placeholder="Valor" class="value">
            <button class="remove">×</button>
        `;

        row.querySelector('.remove').addEventListener('click', () => row.remove());
        container.appendChild(row);
    }

    getParameters(container) {
        const params = {};
        container.querySelectorAll('.parameter-row').forEach(row => {
            const key = row.querySelector('.key').value.trim();
            const value = row.querySelector('.value').value.trim();
            if (key) params[key] = value;
        });
        return params;
    }

    async sendRequest() {
        try {
            this.responseElement.textContent = 'Enviando requisição...';

            const url = this.buildUrl();
            const options = this.buildRequestOptions();

            const response = await fetch(url, options);
            const data = await this.processResponse(response);

            this.displayResponse(data);
        } catch (error) {
            this.responseElement.textContent = `Erro: ${error.message}`;
        }
    }

    buildUrl() {
        let url = this.urlInput.value;
        const params = this.getParameters(this.paramsContainer);

        if (Object.keys(params).length) {
            const queryString = new URLSearchParams(params).toString();
            url += (url.includes('?') ? '&' : '?') + queryString;
        }

        return url;
    }

    buildRequestOptions() {
        const options = {
            method: this.methodSelect.value,
            headers: this.buildHeaders()
        };

        const body = this.getRequestBody();
        if (body) options.body = body;

        return options;
    }

    buildHeaders() {
        const headers = {};
        
        this.headersContainer.querySelectorAll('.parameter-row').forEach(row => {
            const key = row.querySelector('.key').value.trim();
            const value = row.querySelector('.value').value.trim();
            if (key) headers[key] = value;
        });

        if (this.authTokenInput.value) {
            headers['Authorization'] = `Bearer ${this.authTokenInput.value}`;
        }

        return headers;
    }

    getRequestBody() {
        const bodyType = this.bodyTypeSelect.value;
        const content = this.bodyContent.value.trim();

        if (!content) return null;

        switch (bodyType) {
            case 'json':
                try {
                    return JSON.stringify(JSON.parse(content));
                } catch (error) {
                    throw new Error('JSON inválido');
                }
            case 'formdata':
                try {
                    const formData = new FormData();
                    const data = JSON.parse(content);
                    for (const [key, value] of Object.entries(data)) {
                        formData.append(key, value);
                    }
                    return formData;
                } catch (error) {
                    throw new Error('Formato de Form Data inválido');
                }
            case 'raw':
                return content;
            default:
                return content;
        }
    }

    async processResponse(response) {
        try {
            const text = await response.text();
            const json = JSON.parse(text);
            return json;
        } catch (e) {
            return text;
        }
    }

    displayResponse(data) {
        this.originalResponse = data;
        const formattedResponse = typeof data === 'object'
            ? JSON.stringify(data, null, 2)
            : data;

        this.responseElement.textContent = formattedResponse;
    }

    saveTemplate() {
        const template = {
            method: this.methodSelect.value,
            url: this.urlInput.value,
            authToken: this.authTokenInput.value,
            params: this.getParameters(this.paramsContainer),
            headers: this.getParameters(this.headersContainer),
            bodyType: this.bodyTypeSelect.value,
            body: this.bodyContent.value
        };

        const json = JSON.stringify(template, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'noobapi.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    loadTemplate(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const template = JSON.parse(e.target.result);

                this.methodSelect.value = template.method;
                this.urlInput.value = template.url;
                this.authTokenInput.value = template.authToken;
                this.bodyTypeSelect.value = template.bodyType;
                this.bodyContent.value = template.body;

                this.paramsContainer.innerHTML = '';
                Object.entries(template.params || {}).forEach(([key, value]) => {
                    this.addParameterRow(this.paramsContainer);
                    const lastRow = this.paramsContainer.lastElementChild;
                    lastRow.querySelector('.key').value = key;
                    lastRow.querySelector('.value').value = value;
                });

                this.headersContainer.innerHTML = '';
                Object.entries(template.headers || {}).forEach(([key, value]) => {
                    this.addParameterRow(this.headersContainer);
                    const lastRow = this.headersContainer.lastElementChild;
                    lastRow.querySelector('.key').value = key;
                    lastRow.querySelector('.value').value = value;
                });

                alert('Template carregado com sucesso!');
            } catch (error) {
                alert('Erro ao carregar o template: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    copyResponse() {
        navigator.clipboard.writeText(this.responseElement.textContent)
            .then(() => alert('Resposta copiada!'))
            .catch(err => alert('Erro ao copiar resposta: ' + err.message));
    }

    filterResponse() {
        const filterText = this.filterInput.value.trim().toLowerCase();

        if (!filterText) {
            this.responseElement.textContent = typeof this.originalResponse === 'object'
                ? JSON.stringify(this.originalResponse, null, 2)
                : this.originalResponse;
            return;
        }

        try {
            const responseData = typeof this.originalResponse === 'object'
                ? this.originalResponse
                : JSON.parse(this.responseElement.textContent);
                
            const filteredData = this.filterData(responseData, filterText);
            this.responseElement.textContent = JSON.stringify(filteredData, null, 2);
        } catch (error) {
            console.error('Erro ao filtrar:', error);
        }
    }

    filterData(data, filter) {
        if (!data) return data;
        if (typeof data !== 'object' || data === null) return data;

        if (Array.isArray(data)) {
            return data.filter(item => 
                JSON.stringify(item).toLowerCase().includes(filter)
            ).map(item => 
                typeof item === 'object' ? this.filterData(item, filter) : item
            );
        }

        const filteredObj = {};
        Object.entries(data).forEach(([key, value]) => {
            if (key.toLowerCase().includes(filter) ||
                JSON.stringify(value).toLowerCase().includes(filter)) {
                filteredObj[key] = typeof value === 'object' 
                    ? this.filterData(value, filter) 
                    : value;
            }
        });

        return filteredObj;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NoobAPI();
});