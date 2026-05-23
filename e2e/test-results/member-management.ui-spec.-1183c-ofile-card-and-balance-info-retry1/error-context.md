# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: member-management.ui-spec.ts >> Member management flow >> detail page shows profile card and balance info
- Location: e2e/member-management.ui-spec.ts:202:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /充值/ })
Expected: visible
Error: strict mode violation: getByRole('button', { name: /充值/ }) resolved to 2 elements:
    1) <button type="button" class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">…</button> aka getByRole('button', { name: '充值', exact: true })
    2) <button type="button" class="flex items-center gap-2 px-4 py-3 border-b-2 transition-colors border-transparent text-muted-foreground hover:text-foreground">…</button> aka getByRole('button', { name: '充值记录' })

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('button', { name: /充值/ })

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
            - link [ref=e40] [cursor=pointer]:
              - /url: /admin/members
              - img [ref=e41]
            - heading "会员详情" [level=1] [ref=e43]
            - button "充值" [ref=e44] [cursor=pointer]:
              - img [ref=e45]
              - text: 充值
          - generic [ref=e50]:
            - generic [ref=e51]:
              - img [ref=e53]
              - generic [ref=e56]:
                - heading "E2E测试会员_1779521321777_已编辑" [level=2] [ref=e57]
                - generic [ref=e58]: M_0010034
                - generic [ref=e60]:
                  - img [ref=e61]
                  - text: "13999321777"
              - button [ref=e63] [cursor=pointer]:
                - img [ref=e64]
            - generic [ref=e67]:
              - generic [ref=e68]:
                - generic [ref=e69]:
                  - img [ref=e70]
                  - text: 本金余额
                - generic [ref=e72]: 0.00元
              - generic [ref=e73]:
                - generic [ref=e74]:
                  - img [ref=e75]
                  - text: 赠送余额
                - generic [ref=e79]: 0.00元
              - generic [ref=e80]:
                - generic [ref=e81]:
                  - img [ref=e82]
                  - text: 账户总余额
                - generic [ref=e84]: 0.00元
              - generic [ref=e85]:
                - generic [ref=e86]:
                  - img [ref=e87]
                  - text: 总消费
                - generic [ref=e90]: 0.00元
              - generic [ref=e91]:
                - generic [ref=e92]:
                  - img [ref=e93]
                  - text: 消费次数
                - generic [ref=e97]: 0次
          - generic [ref=e99]:
            - button "基本信息" [ref=e100] [cursor=pointer]:
              - img [ref=e101]
              - text: 基本信息
            - button "消费画像" [ref=e104] [cursor=pointer]:
              - img [ref=e105]
              - text: 消费画像
            - button "消费记录" [ref=e107] [cursor=pointer]:
              - img [ref=e108]
              - text: 消费记录
            - button "充值记录" [ref=e112] [cursor=pointer]:
              - img [ref=e113]
              - text: 充值记录
            - button "次卡" [ref=e118] [cursor=pointer]:
              - img [ref=e119]
              - text: 次卡
          - generic [ref=e123]:
            - generic [ref=e124]:
              - generic [ref=e125]: 会员等级
              - generic [ref=e126]: 普通会员-已编辑
              - generic [ref=e127]: 享受 10 折优惠
            - generic [ref=e128]:
              - generic [ref=e129]: 注册时间
              - generic [ref=e130]: 2026/5/23 15:28:46
            - generic [ref=e131]:
              - generic [ref=e132]: 最后消费
              - generic [ref=e133]: 暂无
            - generic [ref=e134]:
              - generic [ref=e135]: 累计充值
              - generic [ref=e136]: 0.00 元
```

# Test source

```ts
  132 |     await expect(
  133 |       page.getByText(createdMemberName).first(),
  134 |     ).toBeVisible({ timeout: 10000 });
  135 |   });
  136 | 
  137 |   // ── 5. Edit member -> click edit button, change name, save ─────────────
  138 | 
  139 |   test('edit member changes name', async () => {
  140 |     await navigateToAdmin(page, '/members');
  141 | 
  142 |     // Find the row with the created member
  143 |     const memberRow = page.locator('a[href^="/admin/members/"]').filter({
  144 |       hasText: createdMemberName,
  145 |     }).first();
  146 |     await expect(memberRow).toBeVisible({ timeout: 10000 });
  147 | 
  148 |     // Extract the member ID from the href
  149 |     const href = await memberRow.getAttribute('href');
  150 |     createdMemberId = href?.replace('/admin/members/', '') ?? null;
  151 |     expect(createdMemberId).toBeTruthy();
  152 | 
  153 |     // Click the "编辑" button within the row (stop propagation, so it won't navigate)
  154 |     const editBtn = memberRow.getByRole('button', { name: '编辑' });
  155 |     await expect(editBtn).toBeVisible({ timeout: 10000 });
  156 |     await editBtn.click();
  157 | 
  158 |     // Edit dialog should appear with heading "编辑会员"
  159 |     await expect(
  160 |       page.getByRole('heading', { name: '编辑会员' }),
  161 |     ).toBeVisible({ timeout: 10000 });
  162 | 
  163 |     // Change name
  164 |     const nameInput = page.getByPlaceholder('请输入会员姓名');
  165 |     await nameInput.clear();
  166 |     await nameInput.fill(`${createdMemberName}_已编辑`);
  167 | 
  168 |     // Submit
  169 |     await page.getByRole('button', { name: '保存' }).click();
  170 | 
  171 |     // Dialog closes
  172 |     await expect(
  173 |       page.getByRole('heading', { name: '编辑会员' }),
  174 |     ).not.toBeVisible({ timeout: 10000 });
  175 | 
  176 |     // Edited name appears in the list
  177 |     await expect(
  178 |       page.getByText(`${createdMemberName}_已编辑`).first(),
  179 |     ).toBeVisible({ timeout: 10000 });
  180 |   });
  181 | 
  182 |   // ── 6. Click member row -> navigates to detail page ────────────────────
  183 | 
  184 |   test('click member row navigates to detail page', async () => {
  185 |     await navigateToAdmin(page, '/members');
  186 | 
  187 |     // Use the edited name to find the member
  188 |     const memberLink = page.locator('a[href^="/admin/members/"]').filter({
  189 |       hasText: `${createdMemberName}_已编辑`,
  190 |     }).first();
  191 |     await expect(memberLink).toBeVisible({ timeout: 10000 });
  192 | 
  193 |     // Click the link (not the edit button)
  194 |     await memberLink.click();
  195 | 
  196 |     // Should navigate to detail page
  197 |     await expect(page).toHaveURL(/\/admin\/members\/[\w-]+/, { timeout: 10000 });
  198 |   });
  199 | 
  200 |   // ── 7. Detail page shows profile card and balance ──────────────────────
  201 | 
  202 |   test('detail page shows profile card and balance info', async () => {
  203 |     // Already on detail page from previous test
  204 | 
  205 |     // Page heading
  206 |     await expect(
  207 |       page.getByRole('heading', { name: '会员详情' }),
  208 |     ).toBeVisible({ timeout: 10000 });
  209 | 
  210 |     // Member name visible in the profile card
  211 |     await expect(
  212 |       page.getByText(`${createdMemberName}_已编辑`),
  213 |     ).toBeVisible({ timeout: 10000 });
  214 | 
  215 |     // Balance labels visible
  216 |     await expect(page.getByText('本金余额')).toBeVisible({ timeout: 10000 });
  217 |     await expect(page.getByText('赠送余额')).toBeVisible({ timeout: 10000 });
  218 |     await expect(page.getByText('账户总余额')).toBeVisible({ timeout: 10000 });
  219 | 
  220 |     // Statistics labels
  221 |     await expect(page.getByText('总消费')).toBeVisible({ timeout: 10000 });
  222 |     await expect(page.getByText('消费次数')).toBeVisible({ timeout: 10000 });
  223 | 
  224 |     // Tabs visible
  225 |     await expect(page.getByText('基本信息')).toBeVisible({ timeout: 10000 });
  226 |     await expect(page.getByText('消费记录')).toBeVisible({ timeout: 10000 });
  227 |     await expect(page.getByText('充值记录')).toBeVisible({ timeout: 10000 });
  228 | 
  229 |     // Recharge button
  230 |     await expect(
  231 |       page.getByRole('button', { name: /充值/ }),
> 232 |     ).toBeVisible({ timeout: 10000 });
      |       ^ Error: expect(locator).toBeVisible() failed
  233 |   });
  234 | 
  235 |   // ── 8. Back to members list from detail ────────────────────────────────
  236 | 
  237 |   test('navigate back to members list from detail', async () => {
  238 |     // Click the back arrow link
  239 |     const backLink = page.locator('a[href="/admin/members"]').first();
  240 |     await expect(backLink).toBeVisible({ timeout: 10000 });
  241 |     await backLink.click();
  242 | 
  243 |     await expect(page).toHaveURL('/admin/members', { timeout: 10000 });
  244 |     await expect(
  245 |       page.getByRole('heading', { name: '会员管理' }),
  246 |     ).toBeVisible({ timeout: 10000 });
  247 |   });
  248 | 
  249 |   // ── 9. Export button exists on members page ────────────────────────────
  250 | 
  251 |   test('export button exists on members page', async () => {
  252 |     await navigateToAdmin(page, '/members');
  253 | 
  254 |     // Export button with Download icon
  255 |     const exportBtn = page.getByRole('button', { name: /导出/ });
  256 |     await expect(exportBtn).toBeVisible({ timeout: 10000 });
  257 |   });
  258 | 
  259 |   // ── 10. Import link exists on members page ─────────────────────────────
  260 | 
  261 |   test('import link exists on members page', async () => {
  262 |     await navigateToAdmin(page, '/members');
  263 | 
  264 |     // Import link points to /admin/members/import
  265 |     const importLink = page.locator('a[href="/admin/members/import"]');
  266 |     await expect(importLink).toBeVisible({ timeout: 10000 });
  267 |   });
  268 | 
  269 |   // ── 11. Member level info visible on list ──────────────────────────────
  270 | 
  271 |   test('member level and balance info visible in list', async () => {
  272 |     await navigateToAdmin(page, '/members');
  273 | 
  274 |     // Column headers
  275 |     await expect(page.getByText('会员信息')).toBeVisible({ timeout: 10000 });
  276 |     await expect(page.getByText('会员等级')).toBeVisible({ timeout: 10000 });
  277 |     await expect(page.getByText('余额')).toBeVisible({ timeout: 10000 });
  278 |     await expect(page.getByText('操作')).toBeVisible({ timeout: 10000 });
  279 | 
  280 |     // The seed has "普通会员" level - it should appear in the list
  281 |     await expect(
  282 |       page.getByText('普通会员'),
  283 |     ).toBeVisible({ timeout: 10000 });
  284 |   });
  285 | });
  286 | 
```