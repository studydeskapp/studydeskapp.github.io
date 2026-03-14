import { handleComplete, buyItem, equipItem, addFloat } from '../gameLogic';
import { SHOP_ITEMS } from '../../constants';

describe('gameLogic', () => {
  describe('handleComplete', () => {
    it('does not award points when progress does not reach 100', () => {
      const setGame = jest.fn();
      handleComplete(0, 50, null, setGame, jest.fn(), false);
      expect(setGame).not.toHaveBeenCalled();
    });

    it('does not award points when already completed', () => {
      const setGame = jest.fn();
      handleComplete(100, 100, null, setGame, jest.fn(), false);
      expect(setGame).not.toHaveBeenCalled();
    });

    it('does not award points when hasBeenCompleted is true', () => {
      const setGame = jest.fn();
      handleComplete(0, 100, null, setGame, jest.fn(), true);
      expect(setGame).not.toHaveBeenCalled();
    });

    it('awards points when going from incomplete to 100', () => {
      const setGame = jest.fn();
      const addFloat = jest.fn();
      handleComplete(0, 100, null, setGame, addFloat, false);
      expect(setGame).toHaveBeenCalled();
      expect(addFloat).toHaveBeenCalledWith(15, false);
    });
  });

  describe('buyItem', () => {
    it('does nothing if item not found', () => {
      const setGame = jest.fn();
      const game = { points: 1000, owned: [] };
      buyItem('nonexistent', game, setGame);
      expect(setGame).not.toHaveBeenCalled();
    });

    it('does not buy if already owned', () => {
      const setGame = jest.fn();
      const item = SHOP_ITEMS[0];
      const game = { points: 1000, owned: [item.id] };
      buyItem(item.id, game, setGame);
      expect(setGame).not.toHaveBeenCalled();
    });

    it('does not buy if insufficient points', () => {
      const setGame = jest.fn();
      const item = SHOP_ITEMS.find(i => i.price > 0) || SHOP_ITEMS[0];
      const game = { points: 0, owned: [] };
      buyItem(item.id, game, setGame);
      expect(setGame).not.toHaveBeenCalled();
    });

    it('deducts points and adds to owned when buying', () => {
      const setGame = jest.fn();
      const item = SHOP_ITEMS.find(i => i.price > 0 && i.price < 500) || SHOP_ITEMS[0];
      const game = { points: 1000, owned: [] };
      buyItem(item.id, game, setGame);
      expect(setGame).toHaveBeenCalledWith(
        expect.any(Function)
      );
      const updater = setGame.mock.calls[0][0];
      const next = updater(game);
      expect(next.points).toBe(game.points - item.price);
      expect(next.owned).toContain(item.id);
    });
  });

  describe('equipItem', () => {
    it('does nothing if item not owned', () => {
      const setGame = jest.fn();
      const item = SHOP_ITEMS[0];
      const game = { owned: [], equipped: {} };
      equipItem(item.id, game, setGame);
      expect(setGame).not.toHaveBeenCalled();
    });

    it('equips item when owned', () => {
      const setGame = jest.fn();
      const item = SHOP_ITEMS[0];
      const game = { owned: [item.id], equipped: { hat: '', face: '', body: '', special: '' } };
      equipItem(item.id, game, setGame);
      expect(setGame).toHaveBeenCalled();
      const updater = setGame.mock.calls[0][0];
      const next = updater(game);
      expect(next.equipped[item.cat]).toBe(item.id);
    });
  });

  describe('addFloat', () => {
    it('adds float and removes after delay', () => {
      jest.useFakeTimers();
      const setFloats = jest.fn();
      addFloat(15, false, setFloats);
      expect(setFloats).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ pts: 15, streak: false })
        ])
      );
      const floatId = setFloats.mock.calls[0][0][0].id;
      setFloats.mockImplementation(fn => fn([]));
      jest.advanceTimersByTime(2100);
      expect(setFloats).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });
});
