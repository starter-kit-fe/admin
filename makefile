# 获取当前时间并格式化版本号
VERSION := $(shell TZ="Asia/Shanghai" date +"%y.%m%d.%H%M")
# 默认提交消息
DEFAULT_MSG := "bump version to v$(VERSION)"

# 定义一个通用的交互式提交函数
define commit_changes
	@read -p "Enter commit message (press Enter for default: $(DEFAULT_MSG)): " msg; \
	if [ -z "$$msg" ]; then \
		msg=$(DEFAULT_MSG); \
	fi; \
	echo "Using commit message: $$msg"; \
	git add .; \
	git commit -m "$$msg"; \
	git push
endef

# 使用纯shell命令更新版本号
update-version:
	@echo "Updating package.json version to $(VERSION)"
	@sed -i.bak 's/"version": "[^"]*"/"version": "$(VERSION)"/' package.json && rm package.json.bak

# 交互式提交版本变更到Git
push-version: update-version
	@echo "Committing version change"
	$(call commit_changes)

# 创建并推送标签，使用交互式提交消息
push-tag: update-version
	@echo "Creating and pushing tag v$(VERSION)"
	$(call commit_changes)
	git tag v$(VERSION)
	git push origin v$(VERSION)

# 开发命令
dev: 
	npm run dev