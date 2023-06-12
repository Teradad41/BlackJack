import { StartView } from '../views/StartView'
import { CardView } from '../views/CardView'
import { MainView } from '../views/MainView'
import { BetView } from '../views/BetView'
import { ActionView } from '../views/ActionView'
import { DELAY, MAINFIELD } from '../config'
import { Table } from '../models/Table'
import { Player } from '../models/Player'
import { ResultModalView } from '../views/ResultModalView'

export class Controller {
  public static renderStartPage(): void {
    StartView.render()
  }

  // betting フェーズ
  public static startBlackJack(player: Player): void {
    const table: Table = new Table(player.getGameType())
    table.setPlayers([player])

    table.blackjackAssignPlayerHands()
    MainView.render(table)
    BetView.render(table)
  }

  // acting フェーズ (プレイヤー)
  public static async playerActingPhase(table: Table, betOrActionDiv: HTMLElement): Promise<void> {
    table.setGamePhase('acting')
    MainView.setStatusField('ON TURN', 'player')
    ActionView.render(table, betOrActionDiv)
    BetView.setTurnColor('player', 'house')

    await DELAY(500)
    CardView.rotateCards('houseCardDiv', 'initial')
    CardView.rotateCards('userCardDiv')
    MainView.setHouseScore(table, 'initial')
    MainView.setPlayerScore(table)
  }

  // action フェーズ （ハウス）
  public static async houseActiongPhase(table: Table): Promise<void> {
    await DELAY(700)
    BetView.setTurnColor('house', 'player')
    MainView.setStatusField('ON TURN', 'house')
    await DELAY(1000)
    CardView.rotateCards('houseCardDiv')
    MainView.setHouseScore(table)

    const house: Player = table.getHouse()

    await DELAY(1000)
    while (house.getHandScore() < 17) {
      await DELAY(1000)
      // メインの動作 カードを追加する
      ActionView.addNewCardToPlayer(house, table, 'house')
      MainView.setStatusField('HIT', 'house')
      await DELAY(700)
      CardView.rotateCards('houseCardDiv')
      await DELAY(1000)
      MainView.setHouseScore(table)
    }

    const houseStatus = () => {
      if (house.getHandScore() === 21 && house.getHand().length === 2) return 'blackjack'
      else if (house.getHandScore() >= 17 && house.getHandScore() <= 21) return 'stand'
      else return 'bust'
    }

    house.setGameStatus(houseStatus())
    MainView.setStatusField(houseStatus().toUpperCase(), 'house')

    Controller.evaluatingWinnersPhase(table)
  }

  // 評価に基づきテーブルを更新する
  public static async evaluatingWinnersPhase(table: Table) {
    table.setGamePhase('evaluatingWinners')

    await DELAY(2000)
    // ページ内で評価を行う
    ResultModalView.render(table)
  }

  public static roundOverPhase(table: Table) {
    MainView.setStatusField('WAITING', 'house')
    MainView.setStatusField('WAITING', 'player')

    // 手札とベットをクリアし、新しく手札を追加する
    table.blackjackClearHandsAndBets()
    table.blackjackAssignPlayerHands()

    MainView.render(table)
    BetView.render(table)

    table.incrementRound()
  }
}
