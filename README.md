# usage-meter

Claude Code 外掛：在輸入框上方常駐顯示 Claude 方案的 5 小時與每週額度使用率和重置時間，每輪對話後自動更新；額度到 80%、95% 時各提醒一次。

```
5小時 █░░░░░░░░░ 3%  4時12分後重置    每週 ████░░░░░░ 38%  5天2時後重置
```

## 安裝

在終端機的 Claude Code 對話中輸入：

```
/plugin install usage-meter --marketplace siegfydj/claude-usage-meter
```

或在 shell 執行：

```
claude plugin install usage-meter --marketplace siegfydj/claude-usage-meter
```

桌面 app：按輸入框旁的 + → Plugins → Add marketplace，填 `siegfydj/claude-usage-meter`，再 Add plugin。
