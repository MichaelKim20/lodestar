# ACC-Coin 검증자 키 관리 설계

## 1. 키 구조

### BLS 키

- 검증자의 주요 식별 키
- 블록 제안 및 검증에 사용
- deposit_data.json에서 관리

### Secp256k1 키

- BLS 마스터 키에서 파생
- 스마트 컨트랙트 상호작용에 사용
- ETH 주소 형태로 사용

## 2. 키 파생 프로세스

```typescript
class KeyDeriver {
  deriveEthereumKey(blsPrivateKey: Buffer): Keypair {
    // HKDF를 사용한 키 파생
    const info = "ACC_VALIDATOR_KEY";
    const salt = "ACC_KEY_DERIVATION";
    const hkdf = new HKDF("sha256", salt, blsPrivateKey, 32);
    const seed = hkdf.derive(info);
    return secp256k1.keyFromPrivate(seed);
  }
}
```

## 3. 예치 컨트랙트

```solidity
contract DepositContract {
    // 1:1 매핑 보장을 위한 상태 변수
    mapping(bytes => address) public validatorToEth;    // BLS pubkey -> ETH address
    mapping(address => bytes) public ethToValidator;    // ETH address -> BLS pubkey

    // 예치 이벤트
    event ValidatorRegistered(
        bytes indexed pubkey,
        address indexed ethAddress
    );

    function deposit(
        bytes calldata pubkey,
        bytes calldata withdrawal_credentials,
        bytes calldata signature,
        bytes32 deposit_data_root,
        bytes calldata ethSignature
    ) external payable {
        // 1. 중복 등록 체크
        require(validatorToEth[pubkey] == address(0), "BLS key already registered");
        require(ethToValidator[msg.sender].length == 0, "ETH address already registered");

        // 2. ETH 서명 검증
        address signer = recoverSigner(pubkey, ethSignature);
        require(signer == msg.sender, "Invalid ETH signature");

        // 3. BLS 검증 (기존 로직)
        require(
            verifyDepositSignature(
                pubkey,
                withdrawal_credentials,
                signature,
                deposit_data_root
            ),
            "Invalid BLS signature"
        );

        // 4. 키 매핑 저장
        validatorToEth[pubkey] = msg.sender;
        ethToValidator[msg.sender] = pubkey;

        emit ValidatorRegistered(pubkey, msg.sender);

        // 5. 예치금 처리
        require(msg.value >= MIN_DEPOSIT_AMOUNT, "Insufficient deposit");
        // ... 예치금 처리 로직
    }
}
```

## 4. 보안 고려사항

1. **키 파생 보안**

   - HKDF 사용으로 안전한 키 파생
   - salt 값으로 추가 보안
   - BLS 키에서 ETH 키를 유추할 수 없음

2. **1:1 매핑 보장**

   - 양방향 매핑으로 중복 등록 방지
   - 트랜잭션 원자성으로 매핑 일관성 보장
   - 등록 후 매핑 변경 불가

3. **서명 검증**
   - BLS 서명 검증 (deposit_data)
   - ETH 서명 검증 (키 소유권)
   - 이중 서명으로 보안 강화

## 5. 복구 프로세스

1. **키 복구**

   - BLS 마스터 키로부터 ETH 키 재생성 가능
   - 니모닉 구문으로 BLS 키 복구
   - 결정적 파생으로 일관성 보장

2. **매핑 조회**
   - 컨트랙트에서 매핑 정보 조회
   - BLS 키로 ETH 주소 조회
   - ETH 주소로 BLS 키 조회

## 6. 구현 시 주의사항

1. **초기화**

   - 키 파생 시 적절한 엔트로피 확보
   - 안전한 난수 생성기 사용

2. **검증**

   - 모든 입력값 검증
   - 서명 검증 철저
   - 예치금 금액 검증

3. **에러 처리**
   - 명확한 에러 메시지
   - 실패 시 상태 롤백
   - 이벤트 로깅
