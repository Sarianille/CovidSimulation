import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SimulationController } from '../simulation.js';

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
      label: "None",
      spreadRate: null,
      restrictions: []
    },
    {
      label: "Normal virus, no restrictions",
      spreadRate: "spreadNormal",
      restrictions: []
    },
    {
      label: "Non-aggressive virus, all restrictions",
      spreadRate: "spreadLow",
      restrictions: ["respirators", "quarantine"]
    }
  ]
});

describe('SimulationController', () => {
  let simulationController;
  let testConfig;
  let testContainer;

  beforeEach(() => {
    testConfig = createTestConfig();

    testContainer = document.createElement('div');
    testContainer.id = 'test-sim';
    document.body.appendChild(testContainer);

    simulationController = new SimulationController(testConfig, 'test-sim');
  });

  describe('event listener management', () => {
    const validEvents = ['simulationStarted', 'simulationUpdated', 'simulationStopped'];
    const invalidEvent = 'invalidEvent1';
    let callback;
    let errorCallback;

    beforeEach(() => {
      callback = vi.fn();
      errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
    });

    it('should add event listeners correctly', () => {
      validEvents.forEach(event => {
        const success = simulationController.addEventListener(event, callback);
        expect(success).toBe(true);
      });
    });

    it('should not add event listeners for invalid events', () => {
      const success = simulationController.addEventListener(invalidEvent, callback);
      expect(success).toBe(false);
    });

    it('should remove event listeners correctly', () => {
      validEvents.forEach(event => {
        simulationController.addEventListener(event, callback);
        const success = simulationController.removeEventListener(event, callback);
        expect(success).toBe(true);
      });
    });

    it('should not remove event listeners for invalid events', () => {
      const success = simulationController.removeEventListener(invalidEvent, callback);
      expect(success).toBe(false);
    });

    it('should trigger event listeners correctly', () => {
      const eventData = { data: 'test' };

      validEvents.forEach(event => {
        simulationController.addEventListener(event, callback);
        simulationController.triggerEvent(event, eventData);
        expect(callback).toHaveBeenCalledWith(eventData);
      });
    });

    it('should handle errors in event listeners', () => {
      const eventData = { data: 'test' };
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const triggerEventSpy = vi.spyOn(simulationController, 'triggerEvent');

      simulationController.addEventListener('simulationStarted', errorCallback);
      simulationController.addEventListener('simulationStarted', callback);

      simulationController.triggerEvent('simulationStarted', eventData);

      expect(triggerEventSpy).toHaveReturned();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error executing event listener for simulationStarted:', 
        new Error('Test error')
      );
      expect(callback).toHaveBeenCalledWith(eventData);
    });
  });

  describe('updateSimulationParameters', () => {
    it('should update spread rate correctly', () => {
      testContainer.querySelectorAll('.sim-spread-item input[type="radio"]').forEach(item => {
        (item.value == '0.5') ? item.checked = true : item.checked = false;
      })

      simulationController.updateSimulationParameters();
      expect(simulationController.simulation.spreadRate).toBe(0.5);
    });

    it('should update restrictions correctly', () => {
      testContainer.querySelectorAll('.sim-restriction-item input[type="checkbox"]').forEach(item => {
        (item.value == 'respirators') ? item.checked = true : item.checked = false;
      })

      const applyRestrictionsSpy = vi.spyOn(simulationController.simulation, 'applyRestrictions');

      simulationController.updateSimulationParameters();
      expect(applyRestrictionsSpy).toHaveBeenCalledWith(['respirators']);
    });
  });

  describe('setInputState', () => {
    it('should disable all inputs except stop button when simulation is running', () => {
      simulationController.setInputState(true);

      const stopButton = testContainer.querySelector('.sim-stop-button');
      const inputs = testContainer.querySelectorAll('input, select, button');

      inputs.forEach(input => {
        if (input == stopButton) {
          expect(input.disabled).toBe(false);
        } else {
          expect(input.disabled).toBe(true);
        }
      });
    });

    it('should enable all inputs except stop button when simulation is stopped', () => {
      simulationController.setInputState(false);

      const stopButton = testContainer.querySelector('.sim-stop-button');
      const inputs = testContainer.querySelectorAll('input, select, button');

      inputs.forEach(input => {
        if (input == stopButton) {
          expect(input.disabled).toBe(true);
        } else {
          expect(input.disabled).toBe(false);
        }
      });
    });
  });

  describe('simulation execution flow', () => {
    let triggerEventSpy;

    beforeEach(() => {
      triggerEventSpy = vi.spyOn(simulationController, 'triggerEvent');
    });

    it('should start the simulation when the start button is clicked', () => {
      simulationController.startButton.click();

      expect(simulationController.simulation.intervalID).toBe(1);
      expect(triggerEventSpy).toHaveBeenCalledWith('simulationStarted', expect.any(Object));
    });

    it('should update the simulation on each tick', () => {
      simulationController.startButton.click();

      const intervalCallback = global.setInterval.mock.calls[0][0];
      intervalCallback();

      expect(triggerEventSpy).toHaveBeenCalledWith('simulationUpdated', expect.any(Object));
    });

    it('should stop the simulation when the stop button is clicked', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      simulationController.startButton.click();
      simulationController.stopButton.click();

      expect(clearIntervalSpy).toHaveBeenCalledWith(1);
      expect(triggerEventSpy).toHaveBeenCalledWith('simulationStopped', expect.any(Object));
    });
  });

  describe('scenario management', () => {
    it('should set scenario configuration correctly', () => {
      simulationController.scenarioMenu.value = '2';
      simulationController.updateScenario();

      const selectedSpreadRate = testContainer.querySelector('.sim-spread-item input[type="radio"]:checked').value;
      const selectedRestrictions = Array.from(
        testContainer.querySelectorAll('.sim-restriction-item input[type="checkbox"]:checked')
      ).map(item => item.value);

      expect(selectedSpreadRate).toBe('0.5');
      expect(selectedRestrictions).toEqual(['respirators', 'quarantine']);
    });

    it('should handle scenario with no spread rate', () => {
      simulationController.scenarioMenu.value = '2';
      simulationController.updateScenario();
      simulationController.scenarioMenu.value = '0';
      simulationController.updateScenario();

      const selectedSpreadRate = testContainer.querySelector('.sim-spread-item input[type="radio"]:checked').value;
      expect(selectedSpreadRate).toBe('0.5');
    });

    it('should handle scenario with no restrictions', () => {
      simulationController.scenarioMenu.value = '2';
      simulationController.updateScenario();
      simulationController.scenarioMenu.value = '0';
      simulationController.updateScenario();

      const selectedRestrictions = Array.from(
        testContainer.querySelectorAll('.sim-restriction-item input[type="checkbox"]:checked')
      ).map(item => item.value);
      expect(selectedRestrictions).toEqual([]);
    });
  });
});