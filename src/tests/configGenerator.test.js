import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConfigGenerator } from '../configGenerator.js';

const mockSimulationController = vi.fn();

const createTestConfig = () => ({
  showHeader: true,
  nodeCount: {
    min: 0,
    max: 100
  },
  infectedPercentage: {
    min: 0,
    max: 100,
    default: 50
  },
  spreadRates: [
    { id: 'spreadLow', label: 'Low', value: 0.5 },
    { id: 'spreadNormal', label: 'Normal', value: 1 }
  ],
  connectionTypes: [
    { id: 'family', label: 'Family', color: '#008000', baseProbability: 0.1, attractionStrength: 0.7 },
    { id: 'workSchool', label: 'Work/School', color: '#0000ff', baseProbability: 0.05, attractionStrength: 0.7 },
    { id: 'strangers', label: 'Strangers', color: '#808080', baseProbability: 0.01, attractionStrength: 0.1 }
  ],
  nodeColors: {
    healthy: '#808080',
    infected: '#ff0000'
  },
  restrictions: [
    {
      id: 'respirators',
      label: 'Respirator usage in public spaces',
      tooltip: 'Friends - majority won\'t follow this restriction.\nSchool/work - helps a bit, people still sit in the same enclosed spaces and are more prone to wear respirators incorrectly at times.\nStrangers - more protected around infected people.',
      multipliers: {
        workSchool: 0.8,
        strangers: 0.5,
      }
    },
    {
      id: 'quarantine',
      label: '2 weeks of quarantine after a positive test',
      tooltip: 'Family - minimal effect due to sharing the same living space.\nFriends - mostly eliminated, but could\'ve spread before the test.\nSchool/work - mostly eliminated, but could\'ve spread before the test.\nStrangers - very unlikely to meet an infectious person.',
      multipliers: {
        family: 0.95,
        workSchool: 0.3,
        strangers: 0.1
      }
    }
  ],
  scenarios: [
    {
      label: "Non-aggressive virus, no restrictions",
      spreadRate: "spreadLow",
      restrictions: []
    },
    {
      label: "Normal virus, no restrictions",
      spreadRate: "spreadNormal",
      restrictions: []
    },
    {
      label: "Normal virus, all restrictions",
      spreadRate: "spreadNormal",
      restrictions: ["respirators", "quarantine"]
    }
  ]
});

const createElements = {
  basicInputs: () => `
    <input id="showHeader" type="checkbox">
    <input id="nodeCountMin" type="number" value="10">
    <input id="nodeCountMax" type="number" value="50">
    <input id="infectedMin" type="number" value="5">
    <input id="infectedMax" type="number" value="20">
    <input id="infectedDefault" type="number" value="10">
    <input id="healthyColor" type="color" value="#000000">
    <input id="infectedColor" type="color" value="#ffffff">
  `,
  
  connectionTypes: () => `
    <div class="connection-type-item">
      <input class="type-id" value="test-conn1">
      <input class="type-label" value="Test Connection 1">
      <input class="type-color" value="#111111">
      <input class="type-probability" value="0.5">
      <input class="type-attraction" value="0.5">
    </div>
    <div class="connection-type-item">
      <input class="type-id" value="test-conn2">
      <input class="type-label" value="Test Connection 2">
      <input class="type-color" value="#222222">
      <input class="type-probability" value="1">
      <input class="type-attraction" value="1">
    </div>
  `,

  spreadRates: () => `
    <div class="spread-rate-item">
      <input class="rate-id" value="test-rate1">
      <input class="rate-label" value="Test Rate 1">
      <input class="rate-value" value="0.5">
    </div>
    <div class="spread-rate-item">
      <input class="rate-id" value="test-rate2">
      <input class="rate-label" value="Test Rate 2">
      <input class="rate-value" value="1">
    </div>
  `,

  restrictions: () => `
    <div class="restriction-item">
      <input class="restriction-id" value="test-restriction1">
      <input class="restriction-label" value="Test Restriction 1">
      <textarea class="restriction-tooltip">Tooltip 1</textarea>
      <input class="multiplier-value" data-connection-type="test-conn1" value="0.5">
      <input class="multiplier-value" data-connection-type="test-conn2" value="0.8">
    </div>
    <div class="restriction-item">
      <input class="restriction-id" value="test-restriction2">
      <input class="restriction-label" value="Test Restriction 2">
      <textarea class="restriction-tooltip">Tooltip 2</textarea>
    </div>
  `,

  scenarios: () => `
    <div class="scenario-item">
      <input class="scenario-label" value="Test Scenario 1">
      <select class="scenario-spread-rate">
        <option value="test-rate1" selected>Test Rate 1</option>
        <option value="test-rate2">Test Rate 2</option>
      </select>
      <div class="scenario-restrictions">
        <input type="checkbox" value="test-restriction1" checked>
        <input type="checkbox" value="test-restriction2">
      </div>
    </div>
    <div class="scenario-item">
      <input class="scenario-label" value="Test Scenario 2">
      <select class="scenario-spread-rate">
        <option value="test-rate1">Test Rate 1</option>
        <option value="test-rate2" selected>Test Rate 2</option>
      </select>
      <div class="scenario-restrictions">
        <input type="checkbox" value="test-restriction1">
        <input type="checkbox" value="test-restriction2">
      </div>
    </div>
  `
};

const testHelpers = {
  assertMethodsCalled: (...spies) => {
    spies.forEach(spy => {
      expect(spy).toHaveBeenCalled();
    });
  },

  testCollectionMethod: (configGenerator, method, elementCreator, expectedResults) => {
    document.body.innerHTML = elementCreator();
    const results = configGenerator[method]();

    expect(results).toHaveLength(expectedResults.length);
    expectedResults.forEach((expected, index) => {
      expect(results[index]).toEqual(expected);
    });

  },

  testEmptyCollection: (configGenerator, method) => {
    document.body.innerHTML = '';
    const results = configGenerator[method]();

    expect(results).toHaveLength(0);
    expect(results).toEqual([]);
  },

  testAddButtonClick: (context, buttonId, stateProperty, additionalAssertions = null) => {
    const {configGenerator, updateStateSpy, refreshSpy } = context;
    const initialItemsAmount = configGenerator.state[stateProperty].length;

    const addButton = document.getElementById(buttonId);
    addButton.click();

    testHelpers.assertMethodsCalled(updateStateSpy, refreshSpy);
    expect(configGenerator.state[stateProperty]).toHaveLength(initialItemsAmount + 1);

    if (additionalAssertions) {
      additionalAssertions(configGenerator);
    }
  }
};

describe('ConfigGenerator', () => {
  let configGenerator;
  let testConfig;

  beforeEach(() => {
    mockSimulationController.mockClear();
    testConfig = createTestConfig();
    configGenerator = new ConfigGenerator(testConfig, mockSimulationController);
  })

  describe('updateState', () => {
    it('should update the state correctly', () => {
      document.body.innerHTML = createElements.basicInputs();

      configGenerator.updateState();

      expect(configGenerator.state).toMatchObject({
        showHeader: false,
        nodeCount: { min: 10, max: 50 },
        infectedPercentage: { min: 5, max: 20, default: 10 },
        nodeColors: { healthy: '#000000', infected: '#ffffff' },
      });
    });
  });

  describe('collectConnectionTypes', () => {
    it('should collect connection types correctly', () => {
      testHelpers.testCollectionMethod(
        configGenerator,
        'collectConnectionTypes',
        createElements.connectionTypes,
        [
          {
            id: 'test-conn1',
            label: 'Test Connection 1',
            color: '#111111',
            baseProbability: 0.5,
            attractionStrength: 0.5
          },
          {
            id: 'test-conn2',
            label: 'Test Connection 2',
            color: '#222222',
            baseProbability: 1,
            attractionStrength: 1
          }
        ]
      );
    });

    it('should handle empty connection types', () => {
      testHelpers.testEmptyCollection(configGenerator, 'collectConnectionTypes');
    });
  });

  describe('collectSpreadRates', () => {
    it('should collect spread rates correctly', () => {
      testHelpers.testCollectionMethod(
        configGenerator,
        'collectSpreadRates',
        createElements.spreadRates,
        [
          { id: 'test-rate1', label: 'Test Rate 1', value: 0.5 },
          { id: 'test-rate2', label: 'Test Rate 2', value: 1 }
        ]
      );
    });

    it('should handle empty spread rates', () => {
      testHelpers.testEmptyCollection(configGenerator, 'collectSpreadRates');
    });
  });

  describe('collectRestrictions', () => {
    it('should collect restrictions correctly', () => {
      testHelpers.testCollectionMethod(
        configGenerator,
        'collectRestrictions',
        createElements.restrictions,
        [
          {
            id: 'test-restriction1',
            label: 'Test Restriction 1',
            tooltip: 'Tooltip 1',
            multipliers: {
              'test-conn1': 0.5,
              'test-conn2': 0.8
            }
          },
          {
            id: 'test-restriction2',
            label: 'Test Restriction 2',
            tooltip: 'Tooltip 2',
            multipliers: {}
          }
        ]
      );
    });

    it('should handle empty restrictions', () => {
      testHelpers.testEmptyCollection(configGenerator, 'collectRestrictions');
    });
  });

  describe('collectScenarios', () => {
    it('should collect scenarios correctly', () => {
      testHelpers.testCollectionMethod(
        configGenerator,
        'collectScenarios',
        createElements.scenarios,
        [
          {
            label: 'Test Scenario 1',
            spreadRate: 'test-rate1',
            restrictions: ['test-restriction1']
          },
          {
            label: 'Test Scenario 2',
            spreadRate: 'test-rate2',
            restrictions: []
          }
        ]
      );
    });
  });

  describe('event listeners', () => {
    let updateStateSpy;
    let refreshSpy;
    let testContext;

    beforeEach(() => {
      updateStateSpy = vi.spyOn(configGenerator, 'updateState');
      refreshSpy = vi.spyOn(configGenerator, 'refreshDynamicSections');

      testContext = {
        configGenerator,
        updateStateSpy,
        refreshSpy
      };
    });

    it('should add connection type when button is clicked', () => {
      testHelpers.testAddButtonClick(testContext, 'addConnectionType', 'connectionTypes');
    });

    it('should add spread rate when button is clicked', () => {
      testHelpers.testAddButtonClick(testContext, 'addSpreadRate', 'spreadRates');
    });

    it('should add restriction when button is clicked', () => {
      testHelpers.testAddButtonClick(
        testContext,
        'addRestriction',
        'restrictions',
        (configGenerator) => {
          expect(configGenerator.state.restrictions[2].multipliers).toEqual({
            family: 1,
            workSchool: 1,
            strangers: 1
          });
        }
      );
    });

    it('should add scenario when button is clicked', () => {
      testHelpers.testAddButtonClick(testContext, 'addScenario', 'scenarios');
    });

    it('should handle delete button clicks correctly', () => {
      const initialConnectionItems = document.querySelectorAll('.connection-type-item');
      const firstItemId = initialConnectionItems[0].querySelector('.type-id').value;
      const secondItemId = initialConnectionItems[1].querySelector('.type-id').value;
      const thirdItemId = initialConnectionItems[2].querySelector('.type-id').value;

      const deleteButton = initialConnectionItems[2].querySelector('.delete-btn');
      deleteButton.click();

      const remainingItems = document.querySelectorAll('.connection-type-item');
      expect(remainingItems).toHaveLength(2);

      const remainingIds = Array.from(remainingItems).map(item => 
        item.querySelector('.type-id').value
      );
      expect(remainingIds).not.toContain(thirdItemId);
      expect(remainingIds).toContain(firstItemId);
      expect(remainingIds).toContain(secondItemId);

      testHelpers.assertMethodsCalled(updateStateSpy, refreshSpy);
      expect(document.querySelectorAll('.connection-type-item')).toHaveLength(2);
      expect(document.querySelectorAll('.spread-rate-item')).toHaveLength(2);
      expect(document.querySelectorAll('.restriction-item')).toHaveLength(2);
      expect(document.querySelectorAll('.scenario-item')).toHaveLength(3);
    });

    it('should create the simulation at button click', () => {
      const createButton = document.getElementById('createSimulation');
      createButton.click();

      expect(mockSimulationController).toHaveBeenCalledWith(
        configGenerator.state,
        'sim-example'
      )
    });
  });

  describe('meta listeners', () => {
    it('should handle copy button', () => {
      configGenerator.addMetaButtons();
      document.body.innerHTML += `
        <textarea class="config-textarea">Test embed code</textarea>
      `;

      configGenerator.addMetaListeners();

      const copyButton = document.getElementById('copy-button');
      copyButton.click();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test embed code');
    });
  });
});