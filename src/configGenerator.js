export class ConfigGenerator {
  constructor(defaultConfig, SimulationController) {
    this.state = defaultConfig;
    this.SimulationController = SimulationController;
    
    this.setupPage = null;
    this.initializeSetupPage();
    this.addEventListeners();
  }

  initializeSetupPage() {
    document.body.innerHTML = '';
    
    this.setupPage = document.createElement('div');
    this.setupPage.id = 'config-generator';
    this.setupPage.className = 'generator-container';
    
    this.renderSetupPage();
    document.body.appendChild(this.setupPage);
  }

  renderSetupPage() {
    this.setupPage.innerHTML = `
      <h1>Simulation Configuration</h1>
      
      <div class="section">
        <h2>Display Options</h2>
        <div class="section-group">
          <label>
            <input type="checkbox" id="showHeader" ${this.state.showHeader ? 'checked' : ''}>
            Show heading and introduction text
          </label>
        </div>
      </div>

      <div class="section">
        <h2>Node Configuration</h2>
        ${this.renderNodeConfig()}
      </div>
      
      <div class="section">
        <h2>Node Colors</h2>
        ${this.renderColors()}
      </div>
      
      <div class="section">
        <h2>Connection Types</h2>
        <div class="section-group">
          <p class="field-description">Define the types of connections between nodes. Each connection should 
          have a unique ID, a display name shown to the user, a color for visualization, a base probability
          of spreading the infection (0-1 range, where 1 means 100% chance of spreading), and an attraction 
          strength that affects how close nodes are to each other (0-2 range).</p>
        </div>

        <div class="field-headers connection-type-headers">
          <div class="header-item">Type ID</div>
          <div class="header-item">Display Label</div>
          <div class="header-item">Color</div>
          <div class="header-item">Spread Probability</div>
          <div class="header-item">Attraction Strength</div>
          <div class="header-item">Actions</div>
        </div>

        <div id="connectionTypes">
          ${this.renderConnectionTypes()}
        </div>
        <button type="button" id="addConnectionType">Add Connection Type</button>
      </div>
      
      <div class="section">
        <h2>Spread Rates</h2>
        <div class="section-group">
          <p class="field-description">Define the rates at which the infection spreads. Each rate should 
          have a unique ID, a display name shown to the user, and a multiplier that affects the speed of infection spread.</p>
        </div>

        <div class="field-headers spread-rate-headers">
          <div class="header-item">Rate ID</div>
          <div class="header-item">Display Label</div>
          <div class="header-item">Rate Multiplier</div>
          <div class="header-item">Actions</div>
        </div>

        <div id="spreadRates">
          ${this.renderSpreadRates()}
        </div>
        <button type="button" id="addSpreadRate">Add Spread Rate</button>
      </div>
      
      <div class="section">
        <h2>Restrictions</h2>
        <div class="section-group">
          <p class="field-description">Define the restrictions that can be applied to the simulation. Each 
          restriction should have a unique ID, a display name shown to the user, a tooltip with additional information,
          and multipliers for each connection type that affect the spread of the infection.</p>
        </div>

        <div id="restrictions">
          ${this.renderRestrictions()}
        </div>
        <button type="button" id="addRestriction">Add Restriction</button>
      </div>

      <div class="section">
        <h2>Scenarios</h2>
        <div class="section-group">
          <p class="field-description">Define the scenarios for the simulation. Each scenario should have 
          a unique label. It can have a spread rate and a set of enabled restrictions, but doesn't have to.</p>
        </div>

        <div id="scenarios">
          ${this.renderScenarios()}
        </div>
        <button type="button" id="addScenario">Add Scenario</button>
      </div>
      
      <button type="button" class="submit-button" id="createSimulation">Create Simulation</button>
    `;
  }

  updateState() {
    this.state.showHeader = document.getElementById('showHeader').checked;
    this.state.nodeCount = {
      min: parseInt(document.getElementById('nodeCountMin').value),
      max: parseInt(document.getElementById('nodeCountMax').value)
    };
    this.state.infectedPercentage = {
      min: parseInt(document.getElementById('infectedMin').value),
      max: parseInt(document.getElementById('infectedMax').value),
      default: parseInt(document.getElementById('infectedDefault').value)
    };
    this.state.nodeColors = {
      healthy: document.getElementById('healthyColor').value,
      infected: document.getElementById('infectedColor').value
    };

    this.state.connectionTypes = this.collectConnectionTypes();
    this.state.spreadRates = this.collectSpreadRates();
    this.state.restrictions = this.collectRestrictions();
    this.state.scenarios = this.collectScenarios();
  }

  addEventListeners() {
    document.getElementById('addConnectionType').addEventListener('click', () => {
      this.updateState();
      this.state.connectionTypes.push({
        id: '', label: '', color: '#000000', baseProbability: 0.05, attractionStrength: 0.7
      });
      this.refreshDynamicSections();
    });

    document.getElementById('addSpreadRate').addEventListener('click', () => {
      this.updateState();
      this.state.spreadRates.push({
        id: '', label: '', value: 1
      });
      this.refreshDynamicSections();
    });

    document.getElementById('addRestriction').addEventListener('click', () => {
      this.updateState();
      const multipliers = {};
      this.state.connectionTypes.forEach(type => {
        multipliers[type.id] = 1;
      });
      this.state.restrictions.push({
        id: '', label: '', tooltip: '', multipliers
      });
      this.refreshDynamicSections();
    });

    document.getElementById('addScenario').addEventListener('click', () => {
      this.updateState();
      this.state.scenarios.push({
        label: '', spreadRate: '', restrictions: []
      });
      this.refreshDynamicSections();
    });

    // Delete button listener using event delegation
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const item = e.target.closest('div[class$="-item"]');
        if (item) {
          item.remove();

          this.updateState();
          this.refreshDynamicSections();
        }
      }
    });

    // Blur event listener for when elements lose focus
    document.addEventListener('change', (e) => {
      if (e.target.matches('input[type="text"], input[type="number"], textarea, select')) {
        if (e.target.closest('.section')) {
          this.updateState();
          this.refreshDynamicSections();
        }
      }
    }, true);

    document.getElementById('createSimulation').addEventListener('click', () => {
      this.updateState();
      document.body.innerHTML = '';

      this.addMetaButtons();

      document.body.innerHTML += `
        <div class="simulation-container" id="sim-example"></div>
      `;

      new this.SimulationController(this.state, "sim-example");
      this.addMetaListeners();
    });
  }

  addMetaListeners() {
    document.getElementById('back-button').addEventListener('click', () => {
      this.initializeSetupPage();
      this.addEventListeners();
    });

    document.getElementById('copy-button').addEventListener('click', () => {
      const simID = "sim-" + crypto.randomUUID();
      const embedCode = `
      <div id="${simID}"></div>
      <link rel="stylesheet" href="https://sarianille.github.io/CovidSimulation/bundle/simulation.css">
      <script type="module">
        import { SimulationController } from 'https://sarianille.github.io/CovidSimulation/bundle/simulation.js';

        const config = ${JSON.stringify(this.state, null, 2)};
        new SimulationController(config, "${simID}");
      </script>
      `

      navigator.clipboard.writeText(embedCode).then(() => {
        alert('Embed code copied to clipboard!');
      });
    });
  }

  addMetaButtons() {
    document.body.innerHTML += `
      <div class="meta-buttons">
        <button type="button" id="back-button">Back to Configuration</button>
        <button type="button" id="copy-button">Copy Simulation</button>
      </div>`;
  }

  refreshDynamicSections() {
    // Only refresh sections that depend on other data
    document.getElementById('connectionTypes').innerHTML = this.renderConnectionTypes();
    document.getElementById('spreadRates').innerHTML = this.renderSpreadRates();
    document.getElementById('restrictions').innerHTML = this.renderRestrictions();
    document.getElementById('scenarios').innerHTML = this.renderScenarios();
  }

  collectConnectionTypes() {
    const types = [];
    document.querySelectorAll('.connection-type-item').forEach(item => {
      types.push({
        id: item.querySelector('.type-id').value,
        label: item.querySelector('.type-label').value,
        color: item.querySelector('.type-color').value,
        baseProbability: parseFloat(item.querySelector('.type-probability').value),
        attractionStrength: parseFloat(item.querySelector('.type-attraction').value)
      });
    });
    return types;
  }

  collectSpreadRates() {
    const rates = [];
    document.querySelectorAll('.spread-rate-item').forEach(item => {
      rates.push({
        id: item.querySelector('.rate-id').value,
        label: item.querySelector('.rate-label').value,
        value: parseFloat(item.querySelector('.rate-value').value)
      });
    });
    return rates;
  }

  collectRestrictions() {
    const restrictions = [];
    document.querySelectorAll('.restriction-item').forEach(item => {
      const multipliers = {};
      item.querySelectorAll('.multiplier-value').forEach(input => {
        multipliers[input.dataset.connectionType] = parseFloat(input.value);
      });
      
      restrictions.push({
        id: item.querySelector('.restriction-id').value,
        label: item.querySelector('.restriction-label').value,
        tooltip: item.querySelector('.restriction-tooltip').value,
        multipliers
      });
    });
    return restrictions;
  }

  collectScenarios() {
    const scenarios = [];
    document.querySelectorAll('.scenario-item').forEach(item => {
      const enabledRestrictions = Array.from(
        item.querySelectorAll('.scenario-restrictions input:checked')
      ).map(checkbox => checkbox.value);

      scenarios.push({
        label: item.querySelector('.scenario-label').value,
        spreadRate: item.querySelector('.scenario-spread-rate').value,
        restrictions: enabledRestrictions
      });
    });
    return scenarios;
  }

  renderNodeConfig() {
    return `
      <div class="section-group">
        <h3>Node Count Range</h3>
        <p class="field-description">Define the minimum and maximum number of nodes that can appear in the simulation.</p>
        <label>
          Minimum:
          <input type="number" id="nodeCountMin" value="${this.state.nodeCount.min}">
        </label>
        <label>
          Maximum:
          <input type="number" id="nodeCountMax" value="${this.state.nodeCount.max}">
        </label>
      </div>
      
      <div class="section-group">
        <h3>Infected Percentage Range</h3>
        <p class="field-description">Define the minimum and maximum percentage of initially infected nodes in the simulation.
        The default value is the percentage of infected nodes at the start of the simulation.</p>
        <label>
          Minimum:
          <input type="number" id="infectedMin" value="${this.state.infectedPercentage.min}" min="0" max="100">
        </label>
        <label>
          Maximum:
          <input type="number" id="infectedMax" value="${this.state.infectedPercentage.max}" min="0" max="100">
        </label>
        <label>
          Default:
          <input type="number" id="infectedDefault" value="${this.state.infectedPercentage.default}" min="0" max="100">
        </label>
      </div>
    `;
  }

  renderColors() {
    return `
      <div class="section-group">
        <p class="field-description">Choose colors to represent different node states in the simulation.</p>
        <label>
          Healthy Node Color:
          <input type="color" id="healthyColor" value="${this.state.nodeColors.healthy}">
        </label>
        <label>
          Infected Node Color:
          <input type="color" id="infectedColor" value="${this.state.nodeColors.infected}">
        </label>
      </div>
    `;
  }

  renderConnectionTypes() {
    return this.state.connectionTypes.map(type => `
      <div class="connection-type-item">
        <input type="text" placeholder="ID" value="${type.id}" class="type-id">
        <input type="text" placeholder="Label" value="${type.label}" class="type-label">
        <input type="color" value="${type.color}" class="type-color">
        <input type="number" step="0.01" placeholder="Base Probability" value="${type.baseProbability}" class="type-probability" min="0" max="1">
        <input type="number" step="0.1" placeholder="Attraction Strength" value="${type.attractionStrength}" class="type-attraction" min="0" max="2">
        <button type="button" class="delete-btn">Delete</button>
      </div>
    `).join('');
  }

  renderSpreadRates() {
    return this.state.spreadRates.map(rate => `
      <div class="spread-rate-item">
        <input type="text" placeholder="ID" value="${rate.id}" class="rate-id">
        <input type="text" placeholder="Label" value="${rate.label}" class="rate-label">
        <input type="number" step="0.1" placeholder="Value" value="${rate.value}" class="rate-value">
        <button type="button" class="delete-btn">Delete</button>
      </div>
    `).join('');
  }

  renderRestrictions() {
    return this.state.restrictions.map(restriction => `
      <div class="restriction-item">
        <div class="basic-info">
          <label><span class="info-label">Restriction ID</span>
            <input type="text" placeholder="ID" value="${restriction.id}" class="restriction-id">
          </label>
          <label><span class="info-label">Display Label</span>
            <input type="text" placeholder="Label" value="${restriction.label}" class="restriction-label">
          </label>
          <label><span class="info-label">Tooltip</span>
            <textarea placeholder="Tooltip" class="restriction-tooltip">${restriction.tooltip}</textarea>
          </label>
        </div>
        <label><span class="info-label">Connection Type Multipliers</span>
          <div class="multipliers">
            ${this.state.connectionTypes.map(type => `
              <label>${type.label} multiplier:
                <input type="number" step="0.01" 
                      value="${restriction.multipliers[type.id] ?? 1}"
                      data-connection-type="${type.id}"
                      class="multiplier-value">
              </label>
            `).join('')}
          </div>
        </label>
        <button type="button" class="delete-btn">Delete</button>
      </div>
    `).join('');
  }

  renderScenarios() {
    return this.state.scenarios.map(scenario => `
      <div class="scenario-item">
        <label><span class="info-label">Scenario Label</span>
          <input type="text" placeholder="Label" value="${scenario.label}" class="scenario-label">
        </label>
        <label><span class="info-label">Spread Rate</span>
          <select class="scenario-spread-rate">
            <option value="">Select Spread Rate</option>
            ${this.state.spreadRates.map(rate => 
              `<option value="${rate.id}" ${rate.id === scenario.spreadRate ? 'selected' : ''}>
                ${rate.label}
              </option>`
            ).join('')}
          </select>
        </label>
        <div class="scenario-restrictions">
          <h4 class="info-label">Enabled Restrictions</h4>
          ${this.state.restrictions.map(restriction => `
            <label>
              <input type="checkbox" value="${restriction.id}" 
                     ${scenario.restrictions.includes(restriction.id) ? 'checked' : ''}>
              ${restriction.label}
            </label>
          `).join('')}
        </div>
        <button type="button" class="delete-btn">Delete</button>
      </div>
    `).join('');
  }
}