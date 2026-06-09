import { useState } from 'react'
import ModeSelect from './components/ModeSelect'

// Single player
import SingleHome from './components/singleplayer/SingleHome'
import Tutorial from './components/singleplayer/Tutorial'
import Practice, { type PracticeResult } from './components/singleplayer/Practice'
import SingleResult from './components/singleplayer/SingleResult'

// Multiplayer
import Login from './components/multiplayer/Login'
import Lobby from './components/multiplayer/Lobby'
import TeamReady from './components/multiplayer/TeamReady'
import GameView from './components/multiplayer/GameView'
import Summary from './components/common/Summary'

import { PLAYERS_DB, type PlayerData } from './constants/players'
import { ALL_SEQUENCES } from './constants/poses'

type View =
  | 'mode-select'
  // Single player
  | 'single-home'
  | 'single-tutorial'
  | 'single-practice'
  | 'single-result'
  // Multiplayer
  | 'multi-login'
  | 'multi-lobby'
  | 'multi-team'
  | 'multi-game'
  | 'multi-summary'

export default function App() {
  const [view, setView] = useState<View>('mode-select')

  // ── Single Player State ──
  const [completedLevels, setCompletedLevels] = useState<number[]>([])
  const [selectedLevel, setSelectedLevel] = useState(1)
  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null)

  // ── Multiplayer State ──
  const [p1Key, setP1Key] = useState('player1')
  const [p2Key, setP2Key] = useState('player2')
  const [selectedSong, setSelectedSong] = useState('打花草：花婆逗趣步')
  const [difficulty, setDifficulty] = useState('Normal')
  const [gameMode, setGameMode] = useState<'versus' | 'coop'>('versus')
  const [roomCode] = useState('KM-888')
  const [isReadyP1, setIsReadyP1] = useState(false)
  const [isReadyP2, setIsReadyP2] = useState(false)
  const [multiReport, setMultiReport] = useState<Record<string, number> | null>(null)

  const p1: PlayerData = PLAYERS_DB[p1Key]
  const p2: PlayerData = PLAYERS_DB[p2Key]

  return (
    <div className="w-full h-full flex flex-col">
      {/* ── 模式選擇 ── */}
      {view === 'mode-select' && (
        <ModeSelect
          onSelectSingle={() => setView('single-home')}
          onSelectMulti={() => setView('multi-login')}
        />
      )}

      {/* ── 單人練習流程 ── */}
      {view === 'single-home' && (
        <SingleHome
          completedLevels={completedLevels}
          onSelectLevel={(id) => {
            setSelectedLevel(id)
            setView('single-tutorial')
          }}
          onBackToModeSelect={() => setView('mode-select')}
        />
      )}

      {view === 'single-tutorial' && (
        <Tutorial
          levelName={ALL_SEQUENCES[selectedLevel]?.name || '未知關卡'}
          levelDesc={ALL_SEQUENCES[selectedLevel]?.description || ''}
          onStartPractice={() => setView('single-practice')}
          onBack={() => setView('single-home')}
        />
      )}

      {view === 'single-practice' && (
        <Practice
          levelId={selectedLevel}
          onFinish={(res) => {
            setPracticeResult(res)
            if (res.passed && !completedLevels.includes(selectedLevel)) {
              setCompletedLevels([...completedLevels, selectedLevel])
            }
            setView('single-result')
          }}
          onBack={() => setView('single-tutorial')}
        />
      )}

      {view === 'single-result' && practiceResult && (
        <SingleResult
          result={practiceResult}
          onRetry={() => setView('single-practice')}
          onHome={() => setView('single-home')}
          onShare={() => {
            const text = `我在打花草傳承平台獲得了 ${practiceResult.score}% 的氣勢值！快來挑戰！`;
            
            if (practiceResult.videoBlob) {
              const file = new File([practiceResult.videoBlob], 'AIPBL_Challenge.webm', { type: 'video/webm' });
              if (navigator.share && navigator.canShare({ files: [file] })) {
                navigator.share({
                  title: '打花草傳承挑戰',
                  text: text,
                  files: [file],
                  url: window.location.href,
                }).catch(console.error);
                return;
              } else {
                // 如果不能直接分享檔案，就幫他下載
                const url = URL.createObjectURL(practiceResult.videoBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'AIPBL_Challenge.webm';
                a.click();
                URL.revokeObjectURL(url);
                // 還是觸發文字分享
                if (navigator.share) {
                  navigator.share({ title: '打花草傳承挑戰', text, url: window.location.href }).catch(console.error);
                } else {
                  alert(`影片已下載！\n請複製這段文字分享：\n\n${text}`);
                }
                return;
              }
            }

            if (navigator.share) {
              navigator.share({
                title: '打花草傳承挑戰',
                text: text,
                url: window.location.href,
              }).catch(console.error);
            } else {
              alert(`請複製這段文字分享：\n\n${text}`);
            }
          }}
        />
      )}

      {/* ── 雙人對戰流程 ── */}
      {view === 'multi-login' && (
        <Login
          onLogin={(p1, p2) => {
            setP1Key(p1)
            setP2Key(p2)
            setView('multi-lobby')
          }}
          onBackToModeSelect={() => setView('mode-select')}
        />
      )}

      {view === 'multi-lobby' && (
        <Lobby
          p1={p1}
          p2={p2}
          onNext={() => setView('multi-team')}
          selectedSong={selectedSong}
          setSelectedSong={setSelectedSong}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          gameMode={gameMode}
          setGameMode={setGameMode as any}
          onBackToModeSelect={() => setView('mode-select')}
        />
      )}

      {view === 'multi-team' && (
        <TeamReady
          p1={p1}
          p2={p2}
          roomCode={roomCode}
          gameMode={gameMode}
          selectedSong={selectedSong}
          difficulty={difficulty}
          isReadyP1={isReadyP1}
          setIsReadyP1={setIsReadyP1}
          isReadyP2={isReadyP2}
          setIsReadyP2={setIsReadyP2}
          onBack={() => setView('multi-lobby')}
          onStart={() => {
            setIsReadyP1(false)
            setIsReadyP2(false)
            setView('multi-game')
          }}
        />
      )}

      {view === 'multi-game' && (
        <GameView
          p1={p1}
          p2={p2}
          song={selectedSong}
          difficulty={difficulty}
          gameMode={gameMode}
          onGameOver={(report) => {
            setMultiReport(report)
            setView('multi-summary')
          }}
          onExit={() => setView('multi-lobby')}
        />
      )}

      {view === 'multi-summary' && multiReport && (
        <Summary
          mode="multi"
          song={selectedSong}
          difficulty={difficulty}
          gameMode={gameMode}
          multiReport={multiReport as any}
          p1={p1}
          p2={p2}
          onRestart={() => setView('multi-game')}
          onBack={() => setView('multi-lobby')}
        />
      )}
    </div>
  )
}
