# 포인트 소각을 위한 사용자 순번 관리

## 1. 개요

포인트 소각 대상 사용자들을 효율적으로 처리하기 위한 순번 관리 시스템

### 사용자 타입

1. **Account 기반**

   - 이더리움 주소 형태
   - 16진수 문자열로 정렬 가능

2. **PhoneNumber 기반**
   - 전화번호의 해시값
   - 16진수 문자열로 정렬 가능

## 2. 블록 구조

### BlockHeader 확장

```typescript
export class BlockHeader {
  // 현재 처리 정보
  public burnPointType: BurnPointType; // Account 또는 PhoneNumber
  public sequenceNumber: number; // 현재 처리할 순번
  public rangeStartHash: string; // 현재 처리중인 범위 시작
  public rangeEndHash: string; // 현재 처리중인 범위 끝

  // 다음 블록 처리 정보
  public nextBurnPointType: BurnPointType;
  public nextSequenceNumber: number;
  public nextRangeStartHash: string;
  public nextRangeEndHash: string;
}
```

### Block 확장

```typescript
export class Block {
  public burnSequences: BurnSequenceRange; // 현� 처리중인 범위의 사용자 정보
}

export class BurnSequenceRange {
  // Account 범위 정보
  public accountRange: {
    startHash: string; // 예: "0x0000"
    endHash: string; // 예: "0x1000"
    addresses: string[]; // 해당 범�의 주소들
  };

  // PhoneHash 범위 정보
  public phoneRange: {
    startHash: string; // 예: "0x0000"
    endHash: string; // 예: "0x1000"
    hashes: string[]; // 해당 범위의 해시들
  };
}
```

## 3. 순번 관리 규칙

1. **순번 할당**

   - Account와 PhoneNumber 각각 별도 관리
   - 16진수 문자열 기준으로 정렬
   - 새로운 사용자는 정렬된 위치에 삽입

2. **처리 순서**

   - Account와 PhoneNumber 타입을 번갈아가며 처리
   - 각 블록에서 1개의 사용자 처리
   - 다음 블록의 처리 대상을 현재 블록에서 지정

3. **새로운 사용자 추가**
   - 포인트 적립시 해당 사용자 정보 추가
   - 정렬된 순서를 유지하며 삽입
   - 전체 순번 목록도 합의 대상에 포함

## 4. 검증

1. **순번 검증**

   - 이전 블록이 지정한 순번/타입과 일치하는지 확인
   - 순번의 연속성 검증
   - 타입 전환의 적절성 검증

2. **사용자 목록 검증**
   - 정렬 상태 확인
   - 중복 여부 확인
   - 새로운 사용자 추가의 적절성 검증

## 5. 구현시 고려사항

1. **성능**

   - 정렬된 목록에 효율적인 삽입
   - 순번 조회 최적화
   - 검증 과정 최적화

2. **안정성**

   - 포크 발생시 일관성 유지
   - 누락된 사용자 없이 처리
   - 중복 처리 방지

3. **확장성**
   - 사용자 수 증가 대응
   - 새로운 사용자 타입 추가 가능성
   - 처리 속도 조정 가능성

## 6. 예시

### 순번 처리 흐름

```
Block N:
  - Type: Account
  - Sequence: 5
  - NextType: PhoneNumber
  - NextSequence: 8

Block N+1:
  - Type: PhoneNumber
  - Sequence: 8
  - NextType: Account
  - NextSequence: 6
```

### 사용자 목록 예시

```typescript
accountAddresses: ["0x1234...", "0x5678...", "0x9abc..."];

phoneHashes: ["0x2345...", "0x6789...", "0xbcde..."];
```
