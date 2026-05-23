# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: member-levels.ui-spec.ts >> Member levels UI >> edit existing level and change name
- Location: e2e/member-levels.ui-spec.ts:99:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('普通会员-已编辑')
Expected: visible
Error: strict mode violation: getByText('普通会员-已编辑') resolved to 2 elements:
    1) <span class="font-medium">普通会员-已编辑</span> aka getByRole('table').getByText('普通会员-已编辑')
    2) <span class="font-medium">普通会员-已编辑</span> aka getByText('普通会员-已编辑').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('普通会员-已编辑')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
              - heading "会员等级管理" [level=1] [ref=e41]
              - paragraph [ref=e42]: 管理会员等级、折扣比例和排序。拖拽行可调整顺序，排序第一的等级为新会员默认等级。
            - button "新增等级" [ref=e43] [cursor=pointer]:
              - img [ref=e44]
              - text: 新增等级
          - table [ref=e47]:
            - rowgroup [ref=e48]:
              - row "等级名称 折扣 关联会员 备注 操作" [ref=e49]:
                - columnheader [ref=e50]
                - columnheader "等级名称" [ref=e51]
                - columnheader "折扣" [ref=e52]
                - columnheader "关联会员" [ref=e53]
                - columnheader "备注" [ref=e54]
                - columnheader "操作" [ref=e55]
            - rowgroup [ref=e56]:
              - row "普通会员-已编辑 默认 无折扣 32 -" [ref=e57]:
                - cell [ref=e58]:
                  - generic "拖拽排序" [ref=e59]:
                    - img [ref=e60]
                - cell "普通会员-已编辑 默认" [ref=e67]:
                  - generic [ref=e68]:
                    - generic [ref=e69]: 普通会员-已编辑
                    - generic [ref=e70]: 默认
                - cell "无折扣" [ref=e71]
                - cell "32" [ref=e72]:
                  - generic [ref=e73]:
                    - img [ref=e74]
                    - generic [ref=e79]: "32"
                - cell "-" [ref=e80]:
                  - generic [ref=e81]: "-"
                - cell [ref=e82]:
                  - generic [ref=e83]:
                    - button "编辑" [ref=e84] [cursor=pointer]:
                      - img [ref=e85]
                    - button "删除" [ref=e88] [cursor=pointer]:
                      - img [ref=e89]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e92]:
                - cell [ref=e93]:
                  - generic "拖拽排序" [ref=e94]:
                    - img [ref=e95]
                - cell "E2E银卡会员" [ref=e102]:
                  - generic [ref=e104]: E2E银卡会员
                - cell "8.5折" [ref=e105]
                - cell "0" [ref=e106]:
                  - generic [ref=e107]:
                    - img [ref=e108]
                    - generic [ref=e113]: "0"
                - cell "E2E测试等级" [ref=e114]:
                  - generic [ref=e115]: E2E测试等级
                - cell [ref=e116]:
                  - generic [ref=e117]:
                    - button "编辑" [ref=e118] [cursor=pointer]:
                      - img [ref=e119]
                    - button "删除" [ref=e122] [cursor=pointer]:
                      - img [ref=e123]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e126]:
                - cell [ref=e127]:
                  - generic "拖拽排序" [ref=e128]:
                    - img [ref=e129]
                - cell "E2E银卡会员" [ref=e136]:
                  - generic [ref=e138]: E2E银卡会员
                - cell "8.5折" [ref=e139]
                - cell "0" [ref=e140]:
                  - generic [ref=e141]:
                    - img [ref=e142]
                    - generic [ref=e147]: "0"
                - cell "E2E测试等级" [ref=e148]:
                  - generic [ref=e149]: E2E测试等级
                - cell [ref=e150]:
                  - generic [ref=e151]:
                    - button "编辑" [ref=e152] [cursor=pointer]:
                      - img [ref=e153]
                    - button "删除" [ref=e156] [cursor=pointer]:
                      - img [ref=e157]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e160]:
                - cell [ref=e161]:
                  - generic "拖拽排序" [ref=e162]:
                    - img [ref=e163]
                - cell "E2E银卡会员" [ref=e170]:
                  - generic [ref=e172]: E2E银卡会员
                - cell "8.5折" [ref=e173]
                - cell "0" [ref=e174]:
                  - generic [ref=e175]:
                    - img [ref=e176]
                    - generic [ref=e181]: "0"
                - cell "E2E测试等级" [ref=e182]:
                  - generic [ref=e183]: E2E测试等级
                - cell [ref=e184]:
                  - generic [ref=e185]:
                    - button "编辑" [ref=e186] [cursor=pointer]:
                      - img [ref=e187]
                    - button "删除" [ref=e190] [cursor=pointer]:
                      - img [ref=e191]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e194]:
                - cell [ref=e195]:
                  - generic "拖拽排序" [ref=e196]:
                    - img [ref=e197]
                - cell "E2E银卡会员" [ref=e204]:
                  - generic [ref=e206]: E2E银卡会员
                - cell "8.5折" [ref=e207]
                - cell "0" [ref=e208]:
                  - generic [ref=e209]:
                    - img [ref=e210]
                    - generic [ref=e215]: "0"
                - cell "E2E测试等级" [ref=e216]:
                  - generic [ref=e217]: E2E测试等级
                - cell [ref=e218]:
                  - generic [ref=e219]:
                    - button "编辑" [ref=e220] [cursor=pointer]:
                      - img [ref=e221]
                    - button "删除" [ref=e224] [cursor=pointer]:
                      - img [ref=e225]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e228]:
                - cell [ref=e229]:
                  - generic "拖拽排序" [ref=e230]:
                    - img [ref=e231]
                - cell "E2E银卡会员" [ref=e238]:
                  - generic [ref=e240]: E2E银卡会员
                - cell "8.5折" [ref=e241]
                - cell "0" [ref=e242]:
                  - generic [ref=e243]:
                    - img [ref=e244]
                    - generic [ref=e249]: "0"
                - cell "E2E测试等级" [ref=e250]:
                  - generic [ref=e251]: E2E测试等级
                - cell [ref=e252]:
                  - generic [ref=e253]:
                    - button "编辑" [ref=e254] [cursor=pointer]:
                      - img [ref=e255]
                    - button "删除" [ref=e258] [cursor=pointer]:
                      - img [ref=e259]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e262]:
                - cell [ref=e263]:
                  - generic "拖拽排序" [ref=e264]:
                    - img [ref=e265]
                - cell "E2E银卡会员" [ref=e272]:
                  - generic [ref=e274]: E2E银卡会员
                - cell "8.5折" [ref=e275]
                - cell "0" [ref=e276]:
                  - generic [ref=e277]:
                    - img [ref=e278]
                    - generic [ref=e283]: "0"
                - cell "E2E测试等级" [ref=e284]:
                  - generic [ref=e285]: E2E测试等级
                - cell [ref=e286]:
                  - generic [ref=e287]:
                    - button "编辑" [ref=e288] [cursor=pointer]:
                      - img [ref=e289]
                    - button "删除" [ref=e292] [cursor=pointer]:
                      - img [ref=e293]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e296]:
                - cell [ref=e297]:
                  - generic "拖拽排序" [ref=e298]:
                    - img [ref=e299]
                - cell "E2E银卡会员" [ref=e306]:
                  - generic [ref=e308]: E2E银卡会员
                - cell "8.5折" [ref=e309]
                - cell "0" [ref=e310]:
                  - generic [ref=e311]:
                    - img [ref=e312]
                    - generic [ref=e317]: "0"
                - cell "E2E测试等级" [ref=e318]:
                  - generic [ref=e319]: E2E测试等级
                - cell [ref=e320]:
                  - generic [ref=e321]:
                    - button "编辑" [ref=e322] [cursor=pointer]:
                      - img [ref=e323]
                    - button "删除" [ref=e326] [cursor=pointer]:
                      - img [ref=e327]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e330]:
                - cell [ref=e331]:
                  - generic "拖拽排序" [ref=e332]:
                    - img [ref=e333]
                - cell "E2E银卡会员" [ref=e340]:
                  - generic [ref=e342]: E2E银卡会员
                - cell "8.5折" [ref=e343]
                - cell "0" [ref=e344]:
                  - generic [ref=e345]:
                    - img [ref=e346]
                    - generic [ref=e351]: "0"
                - cell "E2E测试等级" [ref=e352]:
                  - generic [ref=e353]: E2E测试等级
                - cell [ref=e354]:
                  - generic [ref=e355]:
                    - button "编辑" [ref=e356] [cursor=pointer]:
                      - img [ref=e357]
                    - button "删除" [ref=e360] [cursor=pointer]:
                      - img [ref=e361]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e364]:
                - cell [ref=e365]:
                  - generic "拖拽排序" [ref=e366]:
                    - img [ref=e367]
                - cell "E2E银卡会员" [ref=e374]:
                  - generic [ref=e376]: E2E银卡会员
                - cell "8.5折" [ref=e377]
                - cell "0" [ref=e378]:
                  - generic [ref=e379]:
                    - img [ref=e380]
                    - generic [ref=e385]: "0"
                - cell "E2E测试等级" [ref=e386]:
                  - generic [ref=e387]: E2E测试等级
                - cell [ref=e388]:
                  - generic [ref=e389]:
                    - button "编辑" [ref=e390] [cursor=pointer]:
                      - img [ref=e391]
                    - button "删除" [ref=e394] [cursor=pointer]:
                      - img [ref=e395]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e398]:
                - cell [ref=e399]:
                  - generic "拖拽排序" [ref=e400]:
                    - img [ref=e401]
                - cell "E2E银卡会员" [ref=e408]:
                  - generic [ref=e410]: E2E银卡会员
                - cell "8.5折" [ref=e411]
                - cell "0" [ref=e412]:
                  - generic [ref=e413]:
                    - img [ref=e414]
                    - generic [ref=e419]: "0"
                - cell "E2E测试等级" [ref=e420]:
                  - generic [ref=e421]: E2E测试等级
                - cell [ref=e422]:
                  - generic [ref=e423]:
                    - button "编辑" [ref=e424] [cursor=pointer]:
                      - img [ref=e425]
                    - button "删除" [ref=e428] [cursor=pointer]:
                      - img [ref=e429]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e432]:
                - cell [ref=e433]:
                  - generic "拖拽排序" [ref=e434]:
                    - img [ref=e435]
                - cell "E2E银卡会员" [ref=e442]:
                  - generic [ref=e444]: E2E银卡会员
                - cell "8.5折" [ref=e445]
                - cell "0" [ref=e446]:
                  - generic [ref=e447]:
                    - img [ref=e448]
                    - generic [ref=e453]: "0"
                - cell "E2E测试等级" [ref=e454]:
                  - generic [ref=e455]: E2E测试等级
                - cell [ref=e456]:
                  - generic [ref=e457]:
                    - button "编辑" [ref=e458] [cursor=pointer]:
                      - img [ref=e459]
                    - button "删除" [ref=e462] [cursor=pointer]:
                      - img [ref=e463]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e466]:
                - cell [ref=e467]:
                  - generic "拖拽排序" [ref=e468]:
                    - img [ref=e469]
                - cell "E2E银卡会员" [ref=e476]:
                  - generic [ref=e478]: E2E银卡会员
                - cell "8.5折" [ref=e479]
                - cell "0" [ref=e480]:
                  - generic [ref=e481]:
                    - img [ref=e482]
                    - generic [ref=e487]: "0"
                - cell "E2E测试等级" [ref=e488]:
                  - generic [ref=e489]: E2E测试等级
                - cell [ref=e490]:
                  - generic [ref=e491]:
                    - button "编辑" [ref=e492] [cursor=pointer]:
                      - img [ref=e493]
                    - button "删除" [ref=e496] [cursor=pointer]:
                      - img [ref=e497]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e500]:
                - cell [ref=e501]:
                  - generic "拖拽排序" [ref=e502]:
                    - img [ref=e503]
                - cell "E2E银卡会员" [ref=e510]:
                  - generic [ref=e512]: E2E银卡会员
                - cell "8.5折" [ref=e513]
                - cell "0" [ref=e514]:
                  - generic [ref=e515]:
                    - img [ref=e516]
                    - generic [ref=e521]: "0"
                - cell "E2E测试等级" [ref=e522]:
                  - generic [ref=e523]: E2E测试等级
                - cell [ref=e524]:
                  - generic [ref=e525]:
                    - button "编辑" [ref=e526] [cursor=pointer]:
                      - img [ref=e527]
                    - button "删除" [ref=e530] [cursor=pointer]:
                      - img [ref=e531]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e534]:
                - cell [ref=e535]:
                  - generic "拖拽排序" [ref=e536]:
                    - img [ref=e537]
                - cell "E2E银卡会员" [ref=e544]:
                  - generic [ref=e546]: E2E银卡会员
                - cell "8.5折" [ref=e547]
                - cell "0" [ref=e548]:
                  - generic [ref=e549]:
                    - img [ref=e550]
                    - generic [ref=e555]: "0"
                - cell "E2E测试等级" [ref=e556]:
                  - generic [ref=e557]: E2E测试等级
                - cell [ref=e558]:
                  - generic [ref=e559]:
                    - button "编辑" [ref=e560] [cursor=pointer]:
                      - img [ref=e561]
                    - button "删除" [ref=e564] [cursor=pointer]:
                      - img [ref=e565]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e568]:
                - cell [ref=e569]:
                  - generic "拖拽排序" [ref=e570]:
                    - img [ref=e571]
                - cell "E2E银卡会员" [ref=e578]:
                  - generic [ref=e580]: E2E银卡会员
                - cell "8.5折" [ref=e581]
                - cell "0" [ref=e582]:
                  - generic [ref=e583]:
                    - img [ref=e584]
                    - generic [ref=e589]: "0"
                - cell "E2E测试等级" [ref=e590]:
                  - generic [ref=e591]: E2E测试等级
                - cell [ref=e592]:
                  - generic [ref=e593]:
                    - button "编辑" [ref=e594] [cursor=pointer]:
                      - img [ref=e595]
                    - button "删除" [ref=e598] [cursor=pointer]:
                      - img [ref=e599]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e602]:
                - cell [ref=e603]:
                  - generic "拖拽排序" [ref=e604]:
                    - img [ref=e605]
                - cell "E2E银卡会员" [ref=e612]:
                  - generic [ref=e614]: E2E银卡会员
                - cell "8.5折" [ref=e615]
                - cell "0" [ref=e616]:
                  - generic [ref=e617]:
                    - img [ref=e618]
                    - generic [ref=e623]: "0"
                - cell "E2E测试等级" [ref=e624]:
                  - generic [ref=e625]: E2E测试等级
                - cell [ref=e626]:
                  - generic [ref=e627]:
                    - button "编辑" [ref=e628] [cursor=pointer]:
                      - img [ref=e629]
                    - button "删除" [ref=e632] [cursor=pointer]:
                      - img [ref=e633]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e636]:
                - cell [ref=e637]:
                  - generic "拖拽排序" [ref=e638]:
                    - img [ref=e639]
                - cell "E2E银卡会员" [ref=e646]:
                  - generic [ref=e648]: E2E银卡会员
                - cell "8.5折" [ref=e649]
                - cell "0" [ref=e650]:
                  - generic [ref=e651]:
                    - img [ref=e652]
                    - generic [ref=e657]: "0"
                - cell "E2E测试等级" [ref=e658]:
                  - generic [ref=e659]: E2E测试等级
                - cell [ref=e660]:
                  - generic [ref=e661]:
                    - button "编辑" [ref=e662] [cursor=pointer]:
                      - img [ref=e663]
                    - button "删除" [ref=e666] [cursor=pointer]:
                      - img [ref=e667]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e670]:
                - cell [ref=e671]:
                  - generic "拖拽排序" [ref=e672]:
                    - img [ref=e673]
                - cell "E2E银卡会员" [ref=e680]:
                  - generic [ref=e682]: E2E银卡会员
                - cell "8.5折" [ref=e683]
                - cell "0" [ref=e684]:
                  - generic [ref=e685]:
                    - img [ref=e686]
                    - generic [ref=e691]: "0"
                - cell "E2E测试等级" [ref=e692]:
                  - generic [ref=e693]: E2E测试等级
                - cell [ref=e694]:
                  - generic [ref=e695]:
                    - button "编辑" [ref=e696] [cursor=pointer]:
                      - img [ref=e697]
                    - button "删除" [ref=e700] [cursor=pointer]:
                      - img [ref=e701]
              - row "E2E银卡会员 8.5折 0 E2E测试等级" [ref=e704]:
                - cell [ref=e705]:
                  - generic "拖拽排序" [ref=e706]:
                    - img [ref=e707]
                - cell "E2E银卡会员" [ref=e714]:
                  - generic [ref=e716]: E2E银卡会员
                - cell "8.5折" [ref=e717]
                - cell "0" [ref=e718]:
                  - generic [ref=e719]:
                    - img [ref=e720]
                    - generic [ref=e725]: "0"
                - cell "E2E测试等级" [ref=e726]:
                  - generic [ref=e727]: E2E测试等级
                - cell [ref=e728]:
                  - generic [ref=e729]:
                    - button "编辑" [ref=e730] [cursor=pointer]:
                      - img [ref=e731]
                    - button "删除" [ref=e734] [cursor=pointer]:
                      - img [ref=e735]
          - generic [ref=e738]:
            - generic [ref=e739]: 默认
            - text: 标记表示新会员自动关联该等级。拖拽行调整顺序，排序第一的等级为默认等级。
```

# Test source

```ts
  32  |     // The first level gets a "默认" badge
  33  |     await expect(page.getByText('默认').first()).toBeVisible();
  34  |   });
  35  | 
  36  |   // -------------------------------------------------------------------
  37  |   // 2. "新增等级" opens create dialog
  38  |   // -------------------------------------------------------------------
  39  |   test('new level button opens create dialog', async () => {
  40  |     await navigateToAdmin(page, '/settings/levels');
  41  | 
  42  |     const newLevelButton = page.getByRole('button', { name: /新增等级/ });
  43  |     await expect(newLevelButton).toBeVisible({ timeout: 10000 });
  44  |     await newLevelButton.click();
  45  | 
  46  |     // Verify dialog
  47  |     await expect(page.getByText('新增会员等级')).toBeVisible({ timeout: 10000 });
  48  |     await expect(page.locator('label', { hasText: '等级名称' })).toBeVisible();
  49  |     await expect(page.getByText(/折扣/).first()).toBeVisible();
  50  |     await expect(page.getByText('备注').first()).toBeVisible();
  51  | 
  52  |     // Close dialog via cancel
  53  |     await page.getByRole('button', { name: '取消' }).click();
  54  |     await expect(page.getByText('新增会员等级')).not.toBeVisible();
  55  |   });
  56  | 
  57  |   // -------------------------------------------------------------------
  58  |   // 3. Create new level with name and discount, submit
  59  |   // -------------------------------------------------------------------
  60  |   test('create a new member level', async () => {
  61  |     await navigateToAdmin(page, '/settings/levels');
  62  | 
  63  |     await page.getByRole('button', { name: /新增等级/ }).click();
  64  |     await expect(page.getByText('新增会员等级')).toBeVisible({ timeout: 10000 });
  65  | 
  66  |     // Fill in level name
  67  |     const nameInput = page.getByPlaceholder('如：普通会员、银卡、金卡');
  68  |     await nameInput.fill('E2E银卡会员');
  69  | 
  70  |     // Set discount via the number input (0.85 = 八五折)
  71  |     const discountInput = page.locator('input[type="number"][min="0.1"][max="1.0"]');
  72  |     await discountInput.fill('0.85');
  73  | 
  74  |     // Fill in remark
  75  |     const remarkInput = page.getByPlaceholder('选填，如：消费满500自动升级');
  76  |     await remarkInput.fill('E2E测试等级');
  77  | 
  78  |     // Submit
  79  |     await page.getByRole('button', { name: '保存' }).click();
  80  | 
  81  |     // Dialog should close
  82  |     await expect(page.getByText('新增会员等级')).not.toBeVisible({ timeout: 10000 });
  83  |   });
  84  | 
  85  |   // -------------------------------------------------------------------
  86  |   // 4. New level appears in list
  87  |   // -------------------------------------------------------------------
  88  |   test('newly created level appears in the list', async () => {
  89  |     await navigateToAdmin(page, '/settings/levels');
  90  | 
  91  |     await expect(page.getByText('E2E银卡会员', { exact: true }).first()).toBeVisible({ timeout: 10000 });
  92  |     // 0.85 should render as "8.5折"
  93  |     await expect(page.getByText('8.5折').first()).toBeVisible();
  94  |   });
  95  | 
  96  |   // -------------------------------------------------------------------
  97  |   // 5. Edit existing level, change name, save
  98  |   // -------------------------------------------------------------------
  99  |   test('edit existing level and change name', async () => {
  100 |     await navigateToAdmin(page, '/settings/levels');
  101 | 
  102 |     // Wait for the table to render
  103 |     await expect(page.getByText('普通会员', { exact: true }).first()).toBeVisible({ timeout: 10000 });
  104 | 
  105 |     // Find the row containing "普通会员" and click its edit button.
  106 |     // Desktop view uses a table; the edit button has title="编辑".
  107 |     const levelRow = page.locator('tr', { hasText: '普通会员' }).first();
  108 |     const rowCount = await levelRow.count();
  109 | 
  110 |     if (rowCount > 0) {
  111 |       // Desktop table layout
  112 |       await levelRow.getByRole('button', { name: '编辑' }).click();
  113 |     } else {
  114 |       // Mobile card layout fallback
  115 |       const card = page.locator('div.p-4, div.divide-y > div').filter({ hasText: '普通会员' }).first();
  116 |       await card.getByRole('button', { name: '编辑' }).click();
  117 |     }
  118 | 
  119 |     // Edit dialog should open
  120 |     await expect(page.getByText('编辑会员等级')).toBeVisible({ timeout: 10000 });
  121 | 
  122 |     // Change the name
  123 |     const nameInput = page.getByPlaceholder('如：普通会员、银卡、金卡');
  124 |     await nameInput.clear();
  125 |     await nameInput.fill('普通会员-已编辑');
  126 | 
  127 |     // Save
  128 |     await page.getByRole('button', { name: '保存' }).click();
  129 | 
  130 |     // Dialog should close and updated name visible
  131 |     await expect(page.getByText('编辑会员等级')).not.toBeVisible({ timeout: 10000 });
> 132 |     await expect(page.getByText('普通会员-已编辑')).toBeVisible({ timeout: 10000 });
      |                                              ^ Error: expect(locator).toBeVisible() failed
  133 |   });
  134 | });
  135 | 
```