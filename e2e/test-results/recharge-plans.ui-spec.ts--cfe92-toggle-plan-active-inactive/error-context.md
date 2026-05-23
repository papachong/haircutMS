# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recharge-plans.ui-spec.ts >> Recharge plans management UI >> toggle plan active/inactive
- Location: e2e/recharge-plans.ui-spec.ts:173:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('E2E测试方案_1779521356418')
Expected: visible
Error: strict mode violation: getByText('E2E测试方案_1779521356418') resolved to 2 elements:
    1) <td class="py-3 px-4 font-medium">E2E测试方案_1779521356418</td> aka getByRole('cell', { name: 'E2E测试方案_1779521356418' })
    2) <div class="font-medium truncate">E2E测试方案_1779521356418</div> aka locator('div').filter({ hasText: /^E2E测试方案_1779521356418$/ })

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('E2E测试方案_1779521356418')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e6]: HaircutMS
      - navigation [ref=e7]:
        - link "📊 首页" [ref=e8] [cursor=pointer]:
          - /url: /admin
          - generic [ref=e9]: 📊
          - text: 首页
        - link "💰 收银" [ref=e10] [cursor=pointer]:
          - /url: /admin/pos
          - generic [ref=e11]: 💰
          - text: 收银
        - link "📋 订单" [ref=e12] [cursor=pointer]:
          - /url: /admin/orders
          - generic [ref=e13]: 📋
          - text: 订单
        - link "👥 会员" [ref=e14] [cursor=pointer]:
          - /url: /admin/members
          - generic [ref=e15]: 👥
          - text: 会员
        - link "💵 收入分析" [ref=e16] [cursor=pointer]:
          - /url: /admin/revenue-analytics
          - generic [ref=e17]: 💵
          - text: 收入分析
        - link "📈 会员分析" [ref=e18] [cursor=pointer]:
          - /url: /admin/members/analytics
          - generic [ref=e19]: 📈
          - text: 会员分析
        - link "✂️ 服务" [ref=e20] [cursor=pointer]:
          - /url: /admin/settings/services
          - generic [ref=e21]: ✂️
          - text: 服务
        - link "👤 员工" [ref=e22] [cursor=pointer]:
          - /url: /admin/staff
          - generic [ref=e23]: 👤
          - text: 员工
        - link "📈 员工统计" [ref=e24] [cursor=pointer]:
          - /url: /admin/staff-stats
          - generic [ref=e25]: 📈
          - text: 员工统计
        - link "💳 充值方案" [ref=e26] [cursor=pointer]:
          - /url: /admin/settings/recharge
          - generic [ref=e27]: 💳
          - text: 充值方案
        - link "⚙️ 设置" [ref=e28] [cursor=pointer]:
          - /url: /admin/settings
          - generic [ref=e29]: ⚙️
          - text: 设置
    - main [ref=e30]:
      - button [ref=e33] [cursor=pointer]:
        - img [ref=e34]
      - main [ref=e37]:
        - generic [ref=e38]:
          - generic [ref=e39]:
            - generic [ref=e40]:
              - heading "充值方案管理" [level=1] [ref=e41]
              - paragraph [ref=e42]: 管理充值方案、充赠活动和限时优惠
            - button "新增方案" [ref=e43] [cursor=pointer]:
              - img [ref=e44]
              - text: 新增方案
          - generic [ref=e45]:
            - button "全部 (35)" [ref=e46] [cursor=pointer]
            - button "上架中 (15)" [ref=e47] [cursor=pointer]
            - button "已下架 (20)" [active] [ref=e48] [cursor=pointer]
          - table [ref=e51]:
            - rowgroup [ref=e52]:
              - row "方案名称 类型 充值金额 赠送金额 活动时间 状态 排序 操作" [ref=e53]:
                - columnheader "方案名称" [ref=e54]
                - columnheader "类型" [ref=e55]
                - columnheader "充值金额" [ref=e56]
                - columnheader "赠送金额" [ref=e57]
                - columnheader "活动时间" [ref=e58]
                - columnheader "状态" [ref=e59]
                - columnheader "排序" [ref=e60]
                - columnheader "操作" [ref=e61]
            - rowgroup [ref=e62]:
              - row "E2E测试方案_1779521356418 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e63]:
                - cell "E2E测试方案_1779521356418" [ref=e64]
                - cell "充赠" [ref=e65]:
                  - generic [ref=e66]:
                    - img [ref=e67]
                    - text: 充赠
                - cell "¥200.00" [ref=e71]
                - cell "+¥20.00" [ref=e72]:
                  - generic [ref=e73]: +¥20.00
                - cell "永久有效" [ref=e74]
                - cell "已下架" [ref=e75]
                - cell "0" [ref=e76]
                - cell [ref=e77]:
                  - generic [ref=e78]:
                    - button "上架" [ref=e79] [cursor=pointer]:
                      - img [ref=e80]
                    - button "编辑" [ref=e85] [cursor=pointer]:
                      - img [ref=e86]
                    - button "删除" [ref=e89] [cursor=pointer]:
                      - img [ref=e90]
              - row "E2E测试方案_1779521248379 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e93]:
                - cell "E2E测试方案_1779521248379" [ref=e94]
                - cell "充赠" [ref=e95]:
                  - generic [ref=e96]:
                    - img [ref=e97]
                    - text: 充赠
                - cell "¥200.00" [ref=e101]
                - cell "+¥20.00" [ref=e102]:
                  - generic [ref=e103]: +¥20.00
                - cell "永久有效" [ref=e104]
                - cell "已下架" [ref=e105]
                - cell "0" [ref=e106]
                - cell [ref=e107]:
                  - generic [ref=e108]:
                    - button "上架" [ref=e109] [cursor=pointer]:
                      - img [ref=e110]
                    - button "编辑" [ref=e115] [cursor=pointer]:
                      - img [ref=e116]
                    - button "删除" [ref=e119] [cursor=pointer]:
                      - img [ref=e120]
              - row "E2E测试方案_1779521243182 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e123]:
                - cell "E2E测试方案_1779521243182" [ref=e124]
                - cell "充赠" [ref=e125]:
                  - generic [ref=e126]:
                    - img [ref=e127]
                    - text: 充赠
                - cell "¥200.00" [ref=e131]
                - cell "+¥20.00" [ref=e132]:
                  - generic [ref=e133]: +¥20.00
                - cell "永久有效" [ref=e134]
                - cell "已下架" [ref=e135]
                - cell "0" [ref=e136]
                - cell [ref=e137]:
                  - generic [ref=e138]:
                    - button "上架" [ref=e139] [cursor=pointer]:
                      - img [ref=e140]
                    - button "编辑" [ref=e145] [cursor=pointer]:
                      - img [ref=e146]
                    - button "删除" [ref=e149] [cursor=pointer]:
                      - img [ref=e150]
              - row "E2E测试方案_1779521148085 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e153]:
                - cell "E2E测试方案_1779521148085" [ref=e154]
                - cell "充赠" [ref=e155]:
                  - generic [ref=e156]:
                    - img [ref=e157]
                    - text: 充赠
                - cell "¥200.00" [ref=e161]
                - cell "+¥20.00" [ref=e162]:
                  - generic [ref=e163]: +¥20.00
                - cell "永久有效" [ref=e164]
                - cell "已下架" [ref=e165]
                - cell "0" [ref=e166]
                - cell [ref=e167]:
                  - generic [ref=e168]:
                    - button "上架" [ref=e169] [cursor=pointer]:
                      - img [ref=e170]
                    - button "编辑" [ref=e175] [cursor=pointer]:
                      - img [ref=e176]
                    - button "删除" [ref=e179] [cursor=pointer]:
                      - img [ref=e180]
              - row "E2E测试方案_1779521142936 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e183]:
                - cell "E2E测试方案_1779521142936" [ref=e184]
                - cell "充赠" [ref=e185]:
                  - generic [ref=e186]:
                    - img [ref=e187]
                    - text: 充赠
                - cell "¥200.00" [ref=e191]
                - cell "+¥20.00" [ref=e192]:
                  - generic [ref=e193]: +¥20.00
                - cell "永久有效" [ref=e194]
                - cell "已下架" [ref=e195]
                - cell "0" [ref=e196]
                - cell [ref=e197]:
                  - generic [ref=e198]:
                    - button "上架" [ref=e199] [cursor=pointer]:
                      - img [ref=e200]
                    - button "编辑" [ref=e205] [cursor=pointer]:
                      - img [ref=e206]
                    - button "删除" [ref=e209] [cursor=pointer]:
                      - img [ref=e210]
              - row "E2E测试方案_1779520951318 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e213]:
                - cell "E2E测试方案_1779520951318" [ref=e214]
                - cell "充赠" [ref=e215]:
                  - generic [ref=e216]:
                    - img [ref=e217]
                    - text: 充赠
                - cell "¥200.00" [ref=e221]
                - cell "+¥20.00" [ref=e222]:
                  - generic [ref=e223]: +¥20.00
                - cell "永久有效" [ref=e224]
                - cell "已下架" [ref=e225]
                - cell "0" [ref=e226]
                - cell [ref=e227]:
                  - generic [ref=e228]:
                    - button "上架" [ref=e229] [cursor=pointer]:
                      - img [ref=e230]
                    - button "编辑" [ref=e235] [cursor=pointer]:
                      - img [ref=e236]
                    - button "删除" [ref=e239] [cursor=pointer]:
                      - img [ref=e240]
              - row "E2E测试方案_1779520946207 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e243]:
                - cell "E2E测试方案_1779520946207" [ref=e244]
                - cell "充赠" [ref=e245]:
                  - generic [ref=e246]:
                    - img [ref=e247]
                    - text: 充赠
                - cell "¥200.00" [ref=e251]
                - cell "+¥20.00" [ref=e252]:
                  - generic [ref=e253]: +¥20.00
                - cell "永久有效" [ref=e254]
                - cell "已下架" [ref=e255]
                - cell "0" [ref=e256]
                - cell [ref=e257]:
                  - generic [ref=e258]:
                    - button "上架" [ref=e259] [cursor=pointer]:
                      - img [ref=e260]
                    - button "编辑" [ref=e265] [cursor=pointer]:
                      - img [ref=e266]
                    - button "删除" [ref=e269] [cursor=pointer]:
                      - img [ref=e270]
              - row "E2E测试方案_1779520845437 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e273]:
                - cell "E2E测试方案_1779520845437" [ref=e274]
                - cell "充赠" [ref=e275]:
                  - generic [ref=e276]:
                    - img [ref=e277]
                    - text: 充赠
                - cell "¥200.00" [ref=e281]
                - cell "+¥20.00" [ref=e282]:
                  - generic [ref=e283]: +¥20.00
                - cell "永久有效" [ref=e284]
                - cell "已下架" [ref=e285]
                - cell "0" [ref=e286]
                - cell [ref=e287]:
                  - generic [ref=e288]:
                    - button "上架" [ref=e289] [cursor=pointer]:
                      - img [ref=e290]
                    - button "编辑" [ref=e295] [cursor=pointer]:
                      - img [ref=e296]
                    - button "删除" [ref=e299] [cursor=pointer]:
                      - img [ref=e300]
              - row "E2E测试方案_1779520840080 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e303]:
                - cell "E2E测试方案_1779520840080" [ref=e304]
                - cell "充赠" [ref=e305]:
                  - generic [ref=e306]:
                    - img [ref=e307]
                    - text: 充赠
                - cell "¥200.00" [ref=e311]
                - cell "+¥20.00" [ref=e312]:
                  - generic [ref=e313]: +¥20.00
                - cell "永久有效" [ref=e314]
                - cell "已下架" [ref=e315]
                - cell "0" [ref=e316]
                - cell [ref=e317]:
                  - generic [ref=e318]:
                    - button "上架" [ref=e319] [cursor=pointer]:
                      - img [ref=e320]
                    - button "编辑" [ref=e325] [cursor=pointer]:
                      - img [ref=e326]
                    - button "删除" [ref=e329] [cursor=pointer]:
                      - img [ref=e330]
              - row "E2E测试方案_1779520638464 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e333]:
                - cell "E2E测试方案_1779520638464" [ref=e334]
                - cell "充赠" [ref=e335]:
                  - generic [ref=e336]:
                    - img [ref=e337]
                    - text: 充赠
                - cell "¥200.00" [ref=e341]
                - cell "+¥20.00" [ref=e342]:
                  - generic [ref=e343]: +¥20.00
                - cell "永久有效" [ref=e344]
                - cell "已下架" [ref=e345]
                - cell "0" [ref=e346]
                - cell [ref=e347]:
                  - generic [ref=e348]:
                    - button "上架" [ref=e349] [cursor=pointer]:
                      - img [ref=e350]
                    - button "编辑" [ref=e355] [cursor=pointer]:
                      - img [ref=e356]
                    - button "删除" [ref=e359] [cursor=pointer]:
                      - img [ref=e360]
              - row "E2E测试方案_1779520633284 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e363]:
                - cell "E2E测试方案_1779520633284" [ref=e364]
                - cell "充赠" [ref=e365]:
                  - generic [ref=e366]:
                    - img [ref=e367]
                    - text: 充赠
                - cell "¥200.00" [ref=e371]
                - cell "+¥20.00" [ref=e372]:
                  - generic [ref=e373]: +¥20.00
                - cell "永久有效" [ref=e374]
                - cell "已下架" [ref=e375]
                - cell "0" [ref=e376]
                - cell [ref=e377]:
                  - generic [ref=e378]:
                    - button "上架" [ref=e379] [cursor=pointer]:
                      - img [ref=e380]
                    - button "编辑" [ref=e385] [cursor=pointer]:
                      - img [ref=e386]
                    - button "删除" [ref=e389] [cursor=pointer]:
                      - img [ref=e390]
              - row "E2E测试方案_1779520497368 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e393]:
                - cell "E2E测试方案_1779520497368" [ref=e394]
                - cell "充赠" [ref=e395]:
                  - generic [ref=e396]:
                    - img [ref=e397]
                    - text: 充赠
                - cell "¥200.00" [ref=e401]
                - cell "+¥20.00" [ref=e402]:
                  - generic [ref=e403]: +¥20.00
                - cell "永久有效" [ref=e404]
                - cell "已下架" [ref=e405]
                - cell "0" [ref=e406]
                - cell [ref=e407]:
                  - generic [ref=e408]:
                    - button "上架" [ref=e409] [cursor=pointer]:
                      - img [ref=e410]
                    - button "编辑" [ref=e415] [cursor=pointer]:
                      - img [ref=e416]
                    - button "删除" [ref=e419] [cursor=pointer]:
                      - img [ref=e420]
              - row "E2E测试方案_1779520492234 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e423]:
                - cell "E2E测试方案_1779520492234" [ref=e424]
                - cell "充赠" [ref=e425]:
                  - generic [ref=e426]:
                    - img [ref=e427]
                    - text: 充赠
                - cell "¥200.00" [ref=e431]
                - cell "+¥20.00" [ref=e432]:
                  - generic [ref=e433]: +¥20.00
                - cell "永久有效" [ref=e434]
                - cell "已下架" [ref=e435]
                - cell "0" [ref=e436]
                - cell [ref=e437]:
                  - generic [ref=e438]:
                    - button "上架" [ref=e439] [cursor=pointer]:
                      - img [ref=e440]
                    - button "编辑" [ref=e445] [cursor=pointer]:
                      - img [ref=e446]
                    - button "删除" [ref=e449] [cursor=pointer]:
                      - img [ref=e450]
              - row "E2E测试方案_1779520351206 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e453]:
                - cell "E2E测试方案_1779520351206" [ref=e454]
                - cell "充赠" [ref=e455]:
                  - generic [ref=e456]:
                    - img [ref=e457]
                    - text: 充赠
                - cell "¥200.00" [ref=e461]
                - cell "+¥20.00" [ref=e462]:
                  - generic [ref=e463]: +¥20.00
                - cell "永久有效" [ref=e464]
                - cell "已下架" [ref=e465]
                - cell "0" [ref=e466]
                - cell [ref=e467]:
                  - generic [ref=e468]:
                    - button "上架" [ref=e469] [cursor=pointer]:
                      - img [ref=e470]
                    - button "编辑" [ref=e475] [cursor=pointer]:
                      - img [ref=e476]
                    - button "删除" [ref=e479] [cursor=pointer]:
                      - img [ref=e480]
              - row "E2E测试方案_1779520345813 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e483]:
                - cell "E2E测试方案_1779520345813" [ref=e484]
                - cell "充赠" [ref=e485]:
                  - generic [ref=e486]:
                    - img [ref=e487]
                    - text: 充赠
                - cell "¥200.00" [ref=e491]
                - cell "+¥20.00" [ref=e492]:
                  - generic [ref=e493]: +¥20.00
                - cell "永久有效" [ref=e494]
                - cell "已下架" [ref=e495]
                - cell "0" [ref=e496]
                - cell [ref=e497]:
                  - generic [ref=e498]:
                    - button "上架" [ref=e499] [cursor=pointer]:
                      - img [ref=e500]
                    - button "编辑" [ref=e505] [cursor=pointer]:
                      - img [ref=e506]
                    - button "删除" [ref=e509] [cursor=pointer]:
                      - img [ref=e510]
              - row "E2E测试方案_1779520198479 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e513]:
                - cell "E2E测试方案_1779520198479" [ref=e514]
                - cell "充赠" [ref=e515]:
                  - generic [ref=e516]:
                    - img [ref=e517]
                    - text: 充赠
                - cell "¥200.00" [ref=e521]
                - cell "+¥20.00" [ref=e522]:
                  - generic [ref=e523]: +¥20.00
                - cell "永久有效" [ref=e524]
                - cell "已下架" [ref=e525]
                - cell "0" [ref=e526]
                - cell [ref=e527]:
                  - generic [ref=e528]:
                    - button "上架" [ref=e529] [cursor=pointer]:
                      - img [ref=e530]
                    - button "编辑" [ref=e535] [cursor=pointer]:
                      - img [ref=e536]
                    - button "删除" [ref=e539] [cursor=pointer]:
                      - img [ref=e540]
              - row "E2E测试方案_1779520193174 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e543]:
                - cell "E2E测试方案_1779520193174" [ref=e544]
                - cell "充赠" [ref=e545]:
                  - generic [ref=e546]:
                    - img [ref=e547]
                    - text: 充赠
                - cell "¥200.00" [ref=e551]
                - cell "+¥20.00" [ref=e552]:
                  - generic [ref=e553]: +¥20.00
                - cell "永久有效" [ref=e554]
                - cell "已下架" [ref=e555]
                - cell "0" [ref=e556]
                - cell [ref=e557]:
                  - generic [ref=e558]:
                    - button "上架" [ref=e559] [cursor=pointer]:
                      - img [ref=e560]
                    - button "编辑" [ref=e565] [cursor=pointer]:
                      - img [ref=e566]
                    - button "删除" [ref=e569] [cursor=pointer]:
                      - img [ref=e570]
              - row "E2E测试方案_1779520077716 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e573]:
                - cell "E2E测试方案_1779520077716" [ref=e574]
                - cell "充赠" [ref=e575]:
                  - generic [ref=e576]:
                    - img [ref=e577]
                    - text: 充赠
                - cell "¥200.00" [ref=e581]
                - cell "+¥20.00" [ref=e582]:
                  - generic [ref=e583]: +¥20.00
                - cell "永久有效" [ref=e584]
                - cell "已下架" [ref=e585]
                - cell "0" [ref=e586]
                - cell [ref=e587]:
                  - generic [ref=e588]:
                    - button "上架" [ref=e589] [cursor=pointer]:
                      - img [ref=e590]
                    - button "编辑" [ref=e595] [cursor=pointer]:
                      - img [ref=e596]
                    - button "删除" [ref=e599] [cursor=pointer]:
                      - img [ref=e600]
              - row "E2E测试方案_1779520072455 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e603]:
                - cell "E2E测试方案_1779520072455" [ref=e604]
                - cell "充赠" [ref=e605]:
                  - generic [ref=e606]:
                    - img [ref=e607]
                    - text: 充赠
                - cell "¥200.00" [ref=e611]
                - cell "+¥20.00" [ref=e612]:
                  - generic [ref=e613]: +¥20.00
                - cell "永久有效" [ref=e614]
                - cell "已下架" [ref=e615]
                - cell "0" [ref=e616]
                - cell [ref=e617]:
                  - generic [ref=e618]:
                    - button "上架" [ref=e619] [cursor=pointer]:
                      - img [ref=e620]
                    - button "编辑" [ref=e625] [cursor=pointer]:
                      - img [ref=e626]
                    - button "删除" [ref=e629] [cursor=pointer]:
                      - img [ref=e630]
              - row "E2E测试方案_1779518964657 充赠 ¥200.00 +¥20.00 永久有效 已下架 0" [ref=e633]:
                - cell "E2E测试方案_1779518964657" [ref=e634]
                - cell "充赠" [ref=e635]:
                  - generic [ref=e636]:
                    - img [ref=e637]
                    - text: 充赠
                - cell "¥200.00" [ref=e641]
                - cell "+¥20.00" [ref=e642]:
                  - generic [ref=e643]: +¥20.00
                - cell "永久有效" [ref=e644]
                - cell "已下架" [ref=e645]
                - cell "0" [ref=e646]
                - cell [ref=e647]:
                  - generic [ref=e648]:
                    - button "上架" [ref=e649] [cursor=pointer]:
                      - img [ref=e650]
                    - button "编辑" [ref=e655] [cursor=pointer]:
                      - img [ref=e656]
                    - button "删除" [ref=e659] [cursor=pointer]:
                      - img [ref=e660]
```

# Test source

```ts
  94  |     ).toBeVisible({ timeout: 10000 });
  95  | 
  96  |     // Verify the form fields are present
  97  |     await expect(
  98  |       page.getByLabel('方案名称').or(page.locator('label', { hasText: '方案名称' }))
  99  |     ).toBeVisible();
  100 |     await expect(
  101 |       page.locator('label', { hasText: '方案类型' })
  102 |     ).toBeVisible();
  103 |     await expect(
  104 |       page.locator('label', { hasText: '充值金额' })
  105 |     ).toBeVisible();
  106 |     await expect(
  107 |       page.locator('label', { hasText: '赠送金额' })
  108 |     ).toBeVisible();
  109 |     await expect(
  110 |       page.locator('label', { hasText: '开始时间' })
  111 |     ).toBeVisible();
  112 |     await expect(
  113 |       page.locator('label', { hasText: '结束时间' })
  114 |     ).toBeVisible();
  115 | 
  116 |     // Close the dialog without saving
  117 |     await page
  118 |       .locator('button', { hasText: '取消' })
  119 |       .last()
  120 |       .click();
  121 |     await expect(
  122 |       page.getByRole('heading', { name: '新增充值方案' })
  123 |     ).not.toBeVisible({ timeout: 10000 });
  124 |   });
  125 | 
  126 |   test('create new plan and submit', async () => {
  127 |     const planName = `E2E测试方案_${uniqueSuffix}`;
  128 |     await navigateToAdmin(page, '/settings/recharge');
  129 | 
  130 |     // Click the "新增方案" button
  131 |     await page.getByRole('button', { name: /新增方案/ }).click();
  132 |     await expect(
  133 |       page.getByRole('heading', { name: '新增充值方案' })
  134 |     ).toBeVisible({ timeout: 10000 });
  135 | 
  136 |     // Fill in the plan name
  137 |     const nameInput = page.getByPlaceholder('如：充100送10');
  138 |     await nameInput.fill(planName);
  139 | 
  140 |     // Select GIFT type (充赠)
  141 |     await page.locator('select').selectOption('GIFT');
  142 | 
  143 |     // Fill in the amount (displayed in yuan, internally converted to fen)
  144 |     // The amount input uses formData.amount / 100 for display
  145 |     const amountInput = page.locator('input[type="number"]').first();
  146 |     await amountInput.clear();
  147 |     await amountInput.fill('200');
  148 | 
  149 |     // Fill in gift amount
  150 |     const giftInput = page.locator('input[type="number"]').nth(1);
  151 |     await giftInput.clear();
  152 |     await giftInput.fill('20');
  153 | 
  154 |     // Submit the form - use the save button inside the dialog
  155 |     const dialog = page.locator('.fixed.inset-0');
  156 |     const saveButton = dialog.locator('button', { hasText: '保存' });
  157 |     await saveButton.click();
  158 | 
  159 |     // The modal should close and the new plan should appear in the list
  160 |     await expect(
  161 |       page.getByRole('heading', { name: '新增充值方案' })
  162 |     ).not.toBeVisible({ timeout: 10000 });
  163 | 
  164 |     // Verify the new plan is visible in the list
  165 |     await expect(page.getByText(planName).first()).toBeVisible({ timeout: 10000 });
  166 | 
  167 |     // Verify the gift amount shows correctly (should show +¥20.00 or +20)
  168 |     await expect(
  169 |       page.locator('tr', { hasText: planName }).locator('span', { hasText: /\+¥?20/ })
  170 |     ).toBeVisible();
  171 |   });
  172 | 
  173 |   test('toggle plan active/inactive', async () => {
  174 |     const planName = `E2E测试方案_${uniqueSuffix}`;
  175 |     await navigateToAdmin(page, '/settings/recharge');
  176 | 
  177 |     // Find the row with the newly created plan (may have duplicates from prior runs)
  178 |     const planRow = page.locator('tr', { hasText: planName }).first();
  179 |     await expect(planRow).toBeVisible({ timeout: 10000 });
  180 | 
  181 |     // The plan should currently be active ("进行中" status)
  182 |     await expect(planRow.getByText('进行中').first()).toBeVisible();
  183 | 
  184 |     // Click the eye toggle button to deactivate the plan
  185 |     // The toggle is the first button in the actions column
  186 |     const toggleButton = planRow.locator('button[title="下架"]');
  187 |     await toggleButton.click();
  188 | 
  189 |     // Wait for the status to change to "已下架"
  190 |     await expect(planRow.getByText('已下架')).toBeVisible({ timeout: 10000 });
  191 | 
  192 |     // Switch to "已下架" filter to verify it shows there
  193 |     await page.locator('button', { hasText: /^已下架/ }).click();
> 194 |     await expect(page.getByText(planName)).toBeVisible({ timeout: 10000 });
      |                                            ^ Error: expect(locator).toBeVisible() failed
  195 | 
  196 |     // Switch back to "全部" and reactivate the plan
  197 |     await page.locator('button', { hasText: /^全部/ }).click();
  198 |     await expect(planRow).toBeVisible({ timeout: 10000 });
  199 | 
  200 |     // Now the toggle should show "上架" as the title
  201 |     const reactivateButton = planRow.locator('button[title="上架"]');
  202 |     await reactivateButton.click();
  203 | 
  204 |     // Wait for the status to change back to "进行中"
  205 |     await expect(planRow.getByText('进行中')).toBeVisible({ timeout: 10000 });
  206 |   });
  207 | });
  208 | 
```