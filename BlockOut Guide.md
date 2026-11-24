Cursor 및 modern web 텍스트 스타일에 즉시 적용할 수 있는 3D 테트리스 (Blockout 스타일) 게임 프롬프트용 기술 사양서(PRD)입니다.

---

# 🎮 Product Requirement Document: 3D Tetris (Blockout)

## 1. 프로젝트 개요 (Overview)

* **게임명:** 3D Tetris (Code Name: *BlockOut Web*)
* **목표:** 1989년 고전 명작 *Blockout*의 핵심 메커니즘을 3D 그래픽(Three.js/React Three Fiber) 기반으로 웹 환경에 현대적으로 재구현.
* **핵심 재미 요소:** 깊이감 있는 3D 웰(Pit) 속에서 X, Y, Z축으로 회전하는 블록을 맞추는 입체적 공간 지각 퍼즐.

---

## 2. 게임 공간 및 카메라 (Pit & Camera Specification)

### 2.1 웰(Pit) 좌표계

* **격자 규격 (Grid Size):** Default $5 \times 5 \times 10$ ($Width \times Height \times Depth$)
* **좌표계:**
* $X$축: $-2 \sim +2$ (좌/우)
* $Y$축: $-2 \sim +2$ (상/하)
* $Z$축: $0 \sim 9$ ($0$ = 바닥 층, $9$ = 블록 생성 입구)


* **시각화:** Wireframe 큐브 형태의 웰 외곽선 렌더링. 바닥면($Z=0$)은 격자 선 강조.

### 2.2 카메라 (Camera)

* **위치:** $(0, 0, 15)$ 상공 시점 (Top-down Perspective).
* **시선(LookAt):** $(0, 0, 0)$
* **투영:** PerspectiveCamera (투시 투영 적용으로 입구는 크고, 바닥은 작게 보이도록 처리).

---

## 3. 블록 시스템 (Polyominoes & Movement)

### 3.1 블록 세트 (Block Types)

* **Flat 2D Pieces (Standard Mode):** Tetris 4구체 (I, O, L, J, T, S, Z - 단일 평면).
* **Solid 3D Pieces (Advanced Mode):** 3D 스페셜 큐브 조각 (3D L-shape, Corner Piece 등).

### 3.2 조작 및 회전 메커니즘 (Controls)

3차원 조작을 위해 **이동 4방향**과 **3개 축 회전** 조작을 분리 정의합니다.

| 기능 | 키보드 (Standard PC) | 설명 |
| --- | --- | --- |
| **위치 이동** | `Arrow Keys` (← ↑ → ↓) | $X, Y$ 평면상에서 1칸씩 이동 |
| **X축 회전** | `W` / `S` | X축 기준 전/후 90도 피치(Pitch) 회전 |
| **Y축 회전** | `A` / `D` | Y축 기준 좌/우 90도 요(Yaw) 회전 |
| **Z축 회전** | `Q` / `E` | Z축 기준 시계/반시계 90도 롤(Roll) 회전 |
| **하강 속도 증가** | `Spacebar` (Hold) | 틱 속도 가속 (Soft Drop) |
| **즉시 하강** | `Enter` / `Shift` | 바닥으로 직행 (Hard Drop) |

---

## 4. 핵심 규칙 및 게임 루프 (Core Game Logic)

### 4.1 하강 및 충돌 검사 (Tick & Collision)

1. **생성(Spawn):** 생성 좌표 $(0, 0, Z_{max})$에서 새로운 블록이 나타남.
2. **이동/회전 검사:**
* 블록의 모든 소형 큐브(Voxel)가 $X, Y \in [-2, 2]$, $Z \in [0, 9]$ 범위 내에 있는지 검사.
* 이동하고자 하는 위치에 이미 고정된(Locked) Voxel이 있다면 이동/회전 불가능.


3. **고정(Lock):** Z축 하강 시 충돌 발생 시 위치 고정.

### 4.2 레이어 클리어 (Plane Clearing)

1. **검사 대상:** $Z = 0 \sim Z_{max}$ 각 레이어 (총 25칸).
2. **조건:** 한 레이어의 $5 \times 5 = 25$개 격자가 모두 채워졌을 때.
3. **처리:**
* 해당 $Z$ 레이어 삭제.
* 삭제된 $Z$ 레이어 위의 모든 Voxel을 $Z - 1$ 만큼 1칸씩 아래로 이동.
* 다중 레이어 동시 클리어(Double/Triple/Quadruple Clear) 지원.



### 4.3 게임 오버 (Game Over)

* 블록이 생성되는 최상단 레이어($Z=9$)보다 위쪽으로 Voxel이 고정되거나, 생성 직후 충돌하는 경우 게임 종료.

---

## 5. UI/UX 및 그래픽 가이드라인

1. **와이어프레임 & 뎁스 시각화 (Depth Cues):**
* Z축 깊이에 따라 색상 변화 부여 (예: 바닥 $Z=0$은 붉은색/밝은색, 상단 $Z=9$는 파란색/어두운색).
* 바닥에 투영되는 블록의 **그림자(Shadow Projector)** 표시 필수.


2. **점수 시스템 (Scoring):**
* Basic Drop: 하강 거리당 $1 \text{pt}$.
* Single Plane: $100 \text{pts}$
* Multi Plane Clear: $100 \times N^2 \text{pts}$
* Blockout Bonus (우물을 완전히 비운 경우): $2000 \text{pts}$



---

## 6. 추천 기술 스택 (Tech Stack for Cursor Prompting)

* **Framework:** Next.js (React) + TypeScript
* **3D Engine:** Three.js / `@react-three/fiber` (`@react-three/drei`)
* **State Management:** Zustand (게임 상태, 격자 배열 $5\times5\times10$, 점수 관리)
* **Styling:** Tailwind CSS

---

---

[Blockout 3D Tetris Arcade Gameplay](https://www.youtube.com/watch?v=qTkxmE2AAoo)
3D 테트리스의 원조인 Blockout의 입체적인 우물 구조와 블록 회전 시점을 영상으로 참고하실 수 있습니다.