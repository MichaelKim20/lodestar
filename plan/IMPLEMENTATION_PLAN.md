# ACC-Coin 합의 계층 구현 계획

## 파일 구조 분석

```
lodestar/
├── packages/
│   ├── params/                    # 네트워크 파라미터
│   │   ├── src/forkName.ts       # 포크 정의 (phase0 ~ capella)
│   │   └── src/index.ts          # ACC 파라미터 정의
│   │
│   ├── fork-choice/              # 포크 선택 로직
│   │   └── src/forkChoice/
│   │       ├── interface.ts      # ACC 블록 인터페이스 정의
│   │       └── forkChoice.ts     # ACC 검증 로직 구현
│   │
│   ├── types/                    # ACC 타입 정의
│   │   └── src/types.ts
│   │
│   ├── validator/                # 검증자 로직
│   │   └── src/
│   │       ├── keys/            # 키 관리 (BLS -> Secp256k1 파생)
│   │       └── services/        # 검증 서비스
│   │
│   └── beacon-node/             # 비콘 노드
```

## 주요 수정 파일

1. **params/src/forkName.ts**

```typescript
export enum ForkName {
  phase0 = "phase0",
  altair = "altair",
  bellatrix = "bellatrix",
  capella = "capella",
}
```

2. **params/src/index.ts**

```typescript
export const ACC_PARAMS = {
  NETWORK_ID: 2151,
  MIN_VALIDATORS: 4,
  // ... ACC 특화 파라미터
};
```

3. **fork-choice/src/forkChoice/interface.ts**

```typescript
export interface AccLoyaltyBlock {
  slot: Slot;
  proposer_index: ValidatorIndex;
  body: {
    purchases: PurchaseData[];
    exchangeRates: ExchangeRate[];
    pointBurns: PointBurnData[];
    aggregatedSignature: BlsSignature;
    participatingValidators: BitVector;
  };
}
```

4. **fork-choice/src/forkChoice/forkChoice.ts**

```typescript
export class AccForkChoice implements IForkChoice {
  validateBlock(block: AccLoyaltyBlock): boolean;
  validatePurchases(purchases: PurchaseData[]): boolean;
  validateExchangeRates(rates: ExchangeRate[]): boolean;
  validatePointBurns(burns: PointBurnData[]): boolean;
}
```

## 1. 포크 단순화

### 수정 대상 파일

- packages/params/src/forkName.ts
- packages/params/src/presets/index.ts

### 작업 내용

- deneb, electra 등 불필요한 포크 제거
- phase0, altair, bellatrix, capella만 유지
- 포크 관련 타입과 헬퍼 함수 단순화

## 2. 키 관리 시스템 구현

### 수정 대상 파일

- packages/validator/src/keys/index.ts
- packages/validator/src/services/keymanager.ts
- packages/deposit-contract/contracts/DepositContract.sol

### 작업 내용

1. **키 파생 구현**

- BLS 마스터 키에서 Secp256k1 키 파생
- 키 저장 및 복구 메커니즘

2. **예치 계약 수정**

## 3. ACC Loyalty 데이터 구조

### 수정 대상 파일

- packages/types/src/types.ts
- packages/fork-choice/src/forkChoice/interface.ts

### 작업 내용

```typescript
export interface AccLoyaltyBlock {
  slot: Slot;
  proposer_index: ValidatorIndex;
  parent_root: Root;
  state_root: Root;
  body: {
    purchases: PurchaseData[];
    exchangeRates: ExchangeRate[];
    pointBurns: PointBurnData[];
    aggregatedSignature: BlsSignature;
    participatingValidators: BitVector;
  };
}
```

## 4. 검증 및 서명 로직

### 수정 대상 파일

- packages/validator/src/services/block.ts
- packages/validator/src/services/attestation.ts

### 작업 내용

- Loyalty 데이터 검증 로직
- BLS 서명 집계 로직
- 파생된 Secp256k1 키를 이용한 스마트컨트랙트 상호작용

## 5. ACC 토큰 통합

### 수정 대상 파일

- packages/deposit-contract/contracts/DepositContract.sol
- packages/deposit-contract/contracts/TestToken.sol

### 작업 내용

- ACC 토큰(ERC20) 기반 예치금 처리
- 예치금 검증 로직 수정 (ACC 단위)
- 토큰 회수 기능 추가 검토

## 6. 합의 데이터 구조 변경

### 수정 대상 파일

- packages/types/src/types.ts
- packages/fork-choice/src/forkChoice/interface.ts

### 작업 내용

```typescript
export interface BOSagoraBlock {
  slot: Slot;
  proposer_index: ValidatorIndex;
  parent_root: Root;
  state_root: Root;
  body: {
    transactions: BOSagoraTransaction[];
    attestations: Attestation[];
    deposits: Deposit[];
  };
}

export interface BOSagoraTransaction {
  type: BOSagoraTransactionType;
  data: BOSagoraTransactionData;
  signature: Signature;
}
```

## 7. 네트워크 설정

### 수정 대상 파일

- packages/config/src/networks.ts
- packages/params/src/presets/mainnet.ts

### 작업 내용

```typescript
export const networks = {
  accnet: {
    name: "accnet",
    networkId: 2151,
    depositContractAddress: "0x...",
    genesisTime: 0,
    genesisValidators: 4,
  },
};

export const ACC_PRESET = {
  MIN_DEPOSIT_AMOUNT: BigInt(1000000000),
  MAX_EFFECTIVE_BALANCE: BigInt(32000000000),
  EFFECTIVE_BALANCE_INCREMENT: BigInt(1000000000),

  SECONDS_PER_SLOT: 12,
  SLOTS_PER_EPOCH: 32,
  EPOCHS_PER_SYNC_COMMITTEE_PERIOD: 256,
};
```

## 8. 검증자 로직 수정

### 수정 대상 파일

- packages/validator/src/services/block.ts
- packages/validator/src/services/attestation.ts

### 작업 내용

- ETH1 관련 로직 제거
- BOSagora 트랜잭션 검증 로직 추가
- 블록 생성 로직 수정

## 9. API 수정

### 수정 대상 파일

- packages/api/src/routes/index.ts
- packages/api/src/interface.ts

### 작업 내용

- ETH1 관련 API 제거
- BOSagora 특화 API 추가
  - 트랜잭션 제출
  - 상태 조회
  - 검증자 관리

## 10. 테스트 환경 구성

### 수정 대상 파일

- packages/cli/src/cmds/dev/index.ts
- packages/cli/src/cmds/dev/handler.ts

### 작업 내용

- 로컬 테스트넷 설정
- 테스트용 검증자 생성
- 테스트 토큰 배포

## 구현 우선순위

1. 포크 단순화 (1주)
2. 키 관리 시�템 구현 (1주)
3. ACC Loyalty 데이터 구조 (1주)
4. 검증 및 서명 로직 (1주)
5. ACC 토큰 통합 (2주)
6. 합의 데이터 구조 변경 (2주)
7. 네트워크 설정 (1주)
8. 검증자 로직 수정 (2주)
9. API 수정 (1주)
10. 테스트 환경 구성 (1주)

총 예상 소요 기간: 10주

## 테스트 계획

1. 단위 테스트

   - 각 컴포넌트별 테스트 케이스 작성
   - 토큰 예치/인출 테스트
   - 블록 생성/검증 테스트

2. 통합 테스트

   - 전체 합의 프로세스 테스트
   - 네트워크 동기화 테스트
   - 포크 선택 테스트

3. 성능 테스트
   - TPS 측정
   - 리소스 사용량 모니터링
   - 네트워크 부하 테스트

## 주의사항

1. 보안

   - 토큰 예치 컨트랙트 감사 필요
   - 검증자 키 관리 보안 검토
   - 네트워크 보안 설정 검토

2. 호환성

   - ERC20 표준 준수
   - 기존 이더리움 도구와의 호환성 유지

3. 확장성
   - 향후 기능 추가를 고려한 모듈화
   - 설정 변경 용이성 확보
