/**
 * ChatLog 群聊日报渲染器
 * 用于将 reportData 渲染成可视化的日报页面
 */

(function(window) {
    'use strict';

    /**
     * 配置常量
     */
    const CONFIG = {
        COLORS: [
            '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#22c1c3',
            '#fa709a', '#fee140', '#30cfd0', '#330867', '#a8edea', '#fed6e3',
            '#ff6a00', '#ee0979', '#8e2de2', '#4a00e0', '#f953c6', '#b91d73'
        ],
        WORD_CLOUD: {
            MIN_SIZE: 20,      // 从16增加到20
            MAX_SIZE: 80,      // 从40增加到80
            HEIGHT: 500        // 从300增加到500
        },
        CHART: {
            OPACITY_MIN: 0.1,
            OPACITY_MAX: 0.9
        }
    };

    /**
     * 工具函数
     */
    const Utils = {
        /**
         * 安全地分割文本（处理包含多个分隔符的情况）
         * @param {string} text - 要分割的文本
         * @param {string} separator - 分隔符
         * @returns {object} 包含 prefix 和 suffix 的对象
         */
        safeSplit(text, separator) {
            const index = text.indexOf(separator);
            if (index === -1) {
                return { prefix: '', suffix: text };
            }
            return {
                prefix: text.substring(0, index),
                suffix: text.substring(index + separator.length)
            };
        },

        /**
         * 转义 HTML 特殊字符
         * @param {string} str - 要转义的字符串
         * @returns {string} 转义后的字符串
         */
        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        /**
         * 格式化日期时间
         * @param {Date} date - 日期对象
         * @returns {string} 格式化后的日期时间字符串
         */
        formatDateTime(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        }
    };

    /**
     * 渲染函数集合
     */
    const Renderers = {
        /**
         * 渲染报告头部
         * @param {object} info - 报告基本信息
         */
        renderHeader(info) {
            const container = document.getElementById('report-header');
            if (!container) {
                console.error('找不到 #report-header 容器');
                return;
            }

            container.innerHTML = `
                <div class="report-type">${Utils.escapeHtml(info.reportType)}</div>
                <h1>${Utils.escapeHtml(info.groupName)}群聊${Utils.escapeHtml(info.reportType)}</h1>
                <p class="date">${Utils.escapeHtml(info.dateRange)}</p>
                <div class="meta-info">
                    <div class="meta-info-item">
                        <span class="meta-icon">💬</span>
                        <span>总消息数：<strong>${info.totalMessages}</strong></span>
                    </div>
                    <div class="meta-info-item">
                        <span class="meta-icon">👥</span>
                        <span>活跃用户：<strong>${info.activeUsers}</strong></span>
                    </div>
                    <div class="meta-info-item">
                        <span class="meta-icon">⏱️</span>
                        <span>统计周期：<strong>1天</strong></span>
                    </div>
                </div>
            `;
        },

        /**
         * 渲染热点话题
         * @param {Array} topics - 热点话题数组
         */
        renderHotTopics(topics) {
            const container = document.getElementById('hot-topics-container');
            if (!container) {
                console.error('找不到 #hot-topics-container 容器');
                return;
            }

            if (!topics || topics.length === 0) {
                container.innerHTML = '<p>本期暂无热点话题。</p>';
                return;
            }

            const maxMessages = Math.max(...topics.map(t => t.stats?.messageCount || 0), 1);

            container.innerHTML = topics.map(topic => {
                const heat = Math.round((topic.stats.messageCount / maxMessages) * 100);
                return `
                    <div class="card topic-card">
                        <div class="topic-card-header">
                            <h3>${Utils.escapeHtml(topic.title)}</h3>
                            <div class="topic-heat">🔥 <span>${heat}</span></div>
                        </div>
                        <span class="badge badge-primary">${Utils.escapeHtml(topic.category)}</span>
                        <p class="topic-summary">${Utils.escapeHtml(topic.summary)}</p>
                        <div class="deep-comment">
                            <div class="comment-header"><span class="comment-icon">🎯</span><span class="comment-label">评论</span></div>
                            <div class="comment-content"><p class="comment-text">${Utils.escapeHtml(topic.deepComment)}</p></div>
                        </div>
                        <div class="topic-keywords">
                            ${topic.keywords.map(kw => `<span class="keyword">#${Utils.escapeHtml(kw)}</span>`).join(' ')}
                        </div>
                        <div class="topic-stats">
                            <span class="badge badge-info">💬 ${topic.stats.messageCount}条讨论</span>
                            <span class="badge badge-info">👥 ${topic.stats.participantCount}人参与</span>
                        </div>
                    </div>
                `;
            }).join('');
        },

        /**
         * 渲染资源分享
         * @param {Array} resources - 资源分享数组
         */
        renderSharedResources(resources) {
            const container = document.getElementById('shared-resources-container');
            if (!container) {
                console.error('找不到 #shared-resources-container 容器');
                return;
            }

            if (!resources || resources.length === 0) {
                container.innerHTML = '<p>本期暂无资源分享。</p>';
                return;
            }

            container.innerHTML = resources.map(res => `
                <div class="card tutorial-card">
                    <span class="badge badge-primary">${Utils.escapeHtml(res.type)}</span>
                    <h3>${Utils.escapeHtml(res.title)}</h3>
                    <div class="tutorial-meta">
                        <span>👤 ${Utils.escapeHtml(res.sharer)}</span>
                        <span>🕐 ${Utils.escapeHtml(res.time)}</span>
                    </div>
                    <p class="tutorial-summary">${Utils.escapeHtml(res.summary)}</p>
                    ${res.keyPoints && res.keyPoints.length > 0 ? `
                    <div class="key-points">
                        <h4>核心要点：</h4>
                        <ul>${res.keyPoints.map(p => `<li>${Utils.escapeHtml(p)}</li>`).join('')}</ul>
                    </div>` : ''}
                    <div class="tutorial-link">
                        <a href="${Utils.escapeHtml(res.url)}" target="_blank" rel="noopener noreferrer">🔗 查看原文</a>
                    </div>
                </div>
            `).join('');
        },

        /**
         * 渲染问答精选
         * @param {Array} qas - 问答数组
         */
        renderQaHighlights(qas) {
            const container = document.getElementById('qa-highlights-container');
            if (!container) {
                console.error('找不到 #qa-highlights-container 容器');
                return;
            }

            if (!qas || qas.length === 0) {
                container.innerHTML = '<p>本期暂无精选问答。</p>';
                return;
            }

            container.innerHTML = qas.map(qa => `
                <div class="card qa-card">
                    <div class="question">
                        <div class="question-header">
                            <span class="badge badge-info">问题</span>
                            <span class="question-time">🕐 ${Utils.escapeHtml(qa.question.time)}</span>
                        </div>
                        <h4>${Utils.escapeHtml(qa.question.content)}</h4>
                        <p class="question-asker">提问者：${Utils.escapeHtml(qa.question.asker)}</p>
                    </div>
                    <div class="answers">
                        <div class="answer">
                            <div class="answer-header">
                                <span class="badge badge-primary">最佳答案</span>
                                <span class="answer-time">🕐 ${Utils.escapeHtml(qa.bestAnswer.time)}</span>
                            </div>
                            <p class="answer-responder">回答者：${Utils.escapeHtml(qa.bestAnswer.responder)}</p>
                            <div class="answer-content"><p>${Utils.escapeHtml(qa.bestAnswer.content)}</p></div>
                        </div>
                    </div>
                </div>
            `).join('');
        },

        /**
         * 渲染数据统计与分析
         * @param {object} analytics - 分析数据
         * @param {Array} hotTopics - 热点话题（用于计算热度分布）
         * @param {object} reportInfo - 报告信息
         */
        renderAnalytics(analytics, hotTopics, reportInfo) {
            // 1. 渲染热度分布
            this.renderHeatDistribution(hotTopics);

            // 2. 渲染活跃度排行
            this.renderActivityRanking(analytics.activityRanking);

            // 3. 渲染时段活跃度
            this.renderHourlyActivity(analytics.hourlyActivity);

            // 4. 渲染熬夜冠军
            this.renderNightOwl(analytics.nightOwl);
        },

        /**
         * 渲染热度分布
         * @param {Array} hotTopics - 热点话题数组
         */
        renderHeatDistribution(hotTopics) {
            const container = document.getElementById('heat-distribution-container');
            if (!container) return;

            const totalTopicMessages = hotTopics.reduce((sum, topic) => sum + (topic.stats?.messageCount || 0), 0);

            if (totalTopicMessages === 0) {
                container.innerHTML = '<p>暂无热度数据。</p>';
                return;
            }

            container.innerHTML = hotTopics.map(topic => {
                const percentage = ((topic.stats.messageCount / totalTopicMessages) * 100).toFixed(1);
                return `
                    <div class="heat-item">
                        <div class="heat-header">
                            <span class="heat-topic">${Utils.escapeHtml(topic.title)}</span>
                            <span class="heat-percentage">${percentage}%</span>
                        </div>
                        <div class="heat-bar"><div class="heat-fill" style="width: ${percentage}%;"></div></div>
                        <div class="heat-stats">
                            <span>${topic.stats.messageCount}条消息</span> · <span>${topic.stats.participantCount}人参与</span>
                        </div>
                    </div>
                `;
            }).join('');
        },

        /**
         * 渲染活跃度排行
         * @param {Array} ranking - 排行数据
         */
        renderActivityRanking(ranking) {
            const container = document.getElementById('activity-ranking-container');
            if (!container) return;

            if (!ranking || ranking.length === 0) {
                container.innerHTML = '<p>暂无活跃度数据。</p>';
                return;
            }

            container.innerHTML = ranking.map(user => `
                <div class="participant-card">
                    <div class="participant-rank rank-${user.rank}">${user.rank}</div>
                    <div class="participant-info">
                        <div class="participant-name">${Utils.escapeHtml(user.name)}</div>
                        <div class="participant-stats"><span>💬 ${user.messageCount}条</span></div>
                        <div class="participant-traits">
                            ${user.traits.map(trait => `<span class="badge badge-secondary">${Utils.escapeHtml(trait)}</span>`).join(' ')}
                        </div>
                    </div>
                </div>
            `).join('');
        },

        /**
         * 渲染时段活跃度
         * @param {Array} hourlyActivity - 每小时活跃度数据
         */
        renderHourlyActivity(hourlyActivity) {
            const container = document.getElementById('hourly-activity-chart');
            if (!container) return;

            if (!hourlyActivity || hourlyActivity.length === 0) {
                container.innerHTML = '<p>暂无时段数据。</p>';
                return;
            }

            const maxHourCount = Math.max(...hourlyActivity.map(h => h.count || 0), 1);

            container.innerHTML = hourlyActivity.map(hour => {
                const intensity = hour.count / maxHourCount;
                const bgColor = `rgba(102, 126, 234, ${CONFIG.CHART.OPACITY_MIN + intensity * CONFIG.CHART.OPACITY_MAX})`;
                return `
                    <div class="time-slot" style="background: ${bgColor};">
                        <div class="time-hour">${Utils.escapeHtml(hour.hour)}</div>
                        <div class="time-count">${hour.count}</div>
                    </div>
                `;
            }).join('');
        },

        /**
         * 渲染熬夜冠军
         * @param {object} nightOwl - 熬夜冠军数据
         */
        renderNightOwl(nightOwl) {
            const container = document.getElementById('night-owl-section');
            if (!container) return;

            if (!nightOwl || !nightOwl.name) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = `
                <h3>🌙 熬夜冠军</h3>
                <div class="night-owl-card card">
                    <div class="owl-content">
                        <div class="owl-crown">👑</div>
                        <div class="owl-info">
                            <h4>${Utils.escapeHtml(nightOwl.name)}</h4>
                            <p class="owl-title">"${Utils.escapeHtml(nightOwl.title)}"</p>
                            <div class="owl-stats">
                                <span>🕐 最晚活跃：${Utils.escapeHtml(nightOwl.lastActiveTime)}</span>
                            </div>
                            <p class="owl-quote">"${Utils.escapeHtml(nightOwl.lastMessage)}"</p>
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * 渲染词云（使用 wordcloud2.js 专业布局算法）
         * @param {Array} words - 词云数据 [{word: string, weight: number}, ...]
         */
        renderWordCloud(words) {
            const container = document.getElementById('word-cloud-container');
            if (!container) {
                console.error('找不到 #word-cloud-container 容器');
                return;
            }

            if (!words || words.length === 0) {
                container.innerHTML = '<p>暂无热词。</p>';
                return;
            }

            // 检查 WordCloud 库是否加载
            if (typeof WordCloud === 'undefined') {
                console.warn('WordCloud 库未加载，使用降级方案');
                this.renderWordCloudFallback(words, container);
                return;
            }

            // 清空容器并创建 canvas
            container.innerHTML = '';
            const canvas = document.createElement('canvas');
            canvas.width = container.offsetWidth || 800;
            canvas.height = CONFIG.WORD_CLOUD.HEIGHT;
            canvas.style.opacity = '0';
            canvas.style.transition = 'opacity 0.8s ease-in';
            container.appendChild(canvas);

            // 转换数据格式：[word, weight] 数组
            const wordList = words.map(item => [item.word, item.weight]);

            // 保存词的位置信息，用于 hover 交互
            const wordPositions = [];

            // 使用 wordcloud2.js 渲染
            try {
                const ctx = canvas.getContext('2d');

                WordCloud(canvas, {
                    list: wordList,
                    gridSize: Math.round(16 * canvas.width / 1024),
                    weightFactor: function(size) {
                        const maxWeight = words[0].weight;
                        const minWeight = words[words.length - 1].weight;
                        const normalized = (size - minWeight) / (maxWeight - minWeight || 1);
                        return CONFIG.WORD_CLOUD.MIN_SIZE + normalized * (CONFIG.WORD_CLOUD.MAX_SIZE - CONFIG.WORD_CLOUD.MIN_SIZE);
                    },
                    fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
                    color: function() {
                        // 使用更鲜艳的随机颜色，增加视觉冲击力
                        return CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
                    },
                    rotateRatio: 0.3,
                    rotationSteps: 2,
                    backgroundColor: 'transparent',
                    drawOutOfBound: false,
                    shrinkToFit: true,
                    // 记录每个词的位置信息
                    drawOutOfBound: false,
                    // hover 功能回调
                    hover: function(item, dimension, event) {
                        if (item) {
                            canvas.style.cursor = 'pointer';
                        } else {
                            canvas.style.cursor = 'default';
                        }
                    },
                    click: function(item) {
                        if (item) {
                            // 点击词语时的动画效果（可选）
                            console.log('点击了词语：', item[0]);
                        }
                    }
                });

                // 渲染完成后淡入显示
                setTimeout(() => {
                    canvas.style.opacity = '1';
                }, 100);

                // 添加 hover 高亮效果
                this.addWordCloudInteraction(canvas, wordList, ctx);

            } catch (error) {
                console.error('词云渲染失败:', error);
                this.renderWordCloudFallback(words, container);
            }
        },

        /**
         * 为词云添加 hover 交互效果
         * @param {HTMLCanvasElement} canvas - Canvas 元素
         * @param {Array} wordList - 词语列表
         * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
         */
        addWordCloudInteraction(canvas, wordList, ctx) {
            // 保存原始 canvas 图像
            const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            canvas.addEventListener('mousemove', (event) => {
                const rect = canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                // 获取鼠标位置的像素数据
                const pixel = ctx.getImageData(x, y, 1, 1).data;

                // 如果鼠标在词语上（alpha > 0）
                if (pixel[3] > 0) {
                    canvas.style.cursor = 'pointer';
                    // 添加微妙的缩放效果（通过改变 canvas 的 transform）
                    canvas.style.transform = 'scale(1.02)';
                } else {
                    canvas.style.cursor = 'default';
                    canvas.style.transform = 'scale(1)';
                }
            });

            canvas.addEventListener('mouseleave', () => {
                canvas.style.cursor = 'default';
                canvas.style.transform = 'scale(1)';
            });

            // 添加平滑过渡
            canvas.style.transition = 'transform 0.2s ease-out, opacity 0.8s ease-in';
        },

        /**
         * 词云降级方案（当 wordcloud2.js 未加载时使用）
         * @param {Array} words - 词云数据
         * @param {HTMLElement} container - 容器元素
         */
        renderWordCloudFallback(words, container) {
            const maxWeight = words[0].weight;
            const minWeight = words[words.length - 1].weight;

            // 使用简单网格布局避免重叠
            const gridSize = Math.ceil(Math.sqrt(words.length));

            const cloudHTML = words.map((word, index) => {
                const normalizedWeight = minWeight === maxWeight ? 1 : (word.weight - minWeight) / (maxWeight - minWeight);
                const size = CONFIG.WORD_CLOUD.MIN_SIZE + normalizedWeight * (CONFIG.WORD_CLOUD.MAX_SIZE - CONFIG.WORD_CLOUD.MIN_SIZE);
                const color = CONFIG.COLORS[index % CONFIG.COLORS.length];

                // 网格布局
                const row = Math.floor(index / gridSize);
                const col = index % gridSize;
                const x = (col / gridSize) * 80 + 10;
                const y = (row / gridSize) * 80 + 10;

                return `<span class="cloud-word" style="font-size: ${size}px; color: ${color}; position: absolute; left: ${x}%; top: ${y}%;">${Utils.escapeHtml(word.word)}</span>`;
            }).join('');

            container.style.position = 'relative';
            container.style.height = `${CONFIG.WORD_CLOUD.HEIGHT}px`;
            container.innerHTML = cloudHTML;
        },

        /**
         * 渲染报告总结
         * @param {object} summary - 总结数据
         * @param {object} info - 报告信息
         */
        renderSummary(summary, info) {
            const container = document.getElementById('report-summary-container');
            const title = document.getElementById('summary-title');

            if (!container) {
                console.error('找不到 #report-summary-container 容器');
                return;
            }

            if (title) {
                title.textContent = `📝 ${info.dateRange} 总结`;
            }

            // 安全处理 insights 数组
            const insightsHTML = summary.insights.map(item => {
                const { prefix, suffix } = Utils.safeSplit(item, '：');
                if (prefix) {
                    return `<li><strong>${Utils.escapeHtml(prefix)}：</strong>${Utils.escapeHtml(suffix)}</li>`;
                }
                return `<li>${Utils.escapeHtml(item)}</li>`;
            }).join('');

            container.innerHTML = `
                <h3>核心洞察</h3>
                <ul>${insightsHTML}</ul>
                <h3>趋势分析</h3>
                <p>${Utils.escapeHtml(summary.trends)}</p>
                <h3>建议与展望</h3>
                <p>${Utils.escapeHtml(summary.suggestions)}</p>
            `;
        },

        /**
         * 渲染页脚
         * @param {object} info - 报告信息
         */
        renderFooter(info) {
            const container = document.getElementById('report-footer');
            if (!container) {
                console.error('找不到 #report-footer 容器');
                return;
            }

            const generationTime = Utils.formatDateTime(new Date());

            container.innerHTML = `
                <div class="footer-info">
                    <span>📊 数据来源：${Utils.escapeHtml(info.groupName)}</span>
                    <span>📅 统计周期：${Utils.escapeHtml(info.dateRange)}</span>
                    <span>🕐 生成时间：${generationTime}</span>
                </div>
                <p class="disclaimer">
                    免责声明：本报告由 ChatInsight 基于群聊公开内容自动生成，仅供参考。
                </p>
            `;
        }
    };

    /**
     * 主渲染器
     */
    const ChatLogRenderer = {
        /**
         * 初始化渲染
         * @param {object} reportData - 完整的报告数据
         */
        init(reportData) {
            try {
                // 数据验证
                if (!reportData || typeof reportData !== 'object') {
                    throw new Error('无效的报告数据');
                }

                const {
                    reportInfo,
                    hotTopics,
                    sharedResources,
                    qaHighlights,
                    analytics,
                    wordCloud,
                    reportSummary
                } = reportData;

                // 设置页面标题
                if (reportInfo) {
                    document.title = `${reportInfo.groupName}${reportInfo.reportType} - ${reportInfo.dateRange}`;
                }

                // 执行渲染
                Renderers.renderHeader(reportInfo);
                Renderers.renderHotTopics(hotTopics);
                Renderers.renderSharedResources(sharedResources);
                Renderers.renderQaHighlights(qaHighlights);
                Renderers.renderAnalytics(analytics, hotTopics, reportInfo);
                Renderers.renderWordCloud(wordCloud);
                Renderers.renderSummary(reportSummary, reportInfo);
                Renderers.renderFooter(reportInfo);

                console.log('✅ ChatLog 日报渲染完成');
            } catch (error) {
                console.error('❌ 渲染失败:', error);
                this.showError(error.message);
            }
        },

        /**
         * 显示错误信息
         * @param {string} message - 错误消息
         */
        showError(message) {
            const container = document.querySelector('.container');
            if (container) {
                container.innerHTML = `
                    <div style="padding: 40px; text-align: center; color: #f5576c;">
                        <h2>⚠️ 渲染失败</h2>
                        <p>${Utils.escapeHtml(message)}</p>
                        <p style="color: #666; font-size: 14px; margin-top: 20px;">
                            请检查控制台获取详细错误信息
                        </p>
                    </div>
                `;
            }
        }
    };

    // 导出到全局
    window.ChatLogRenderer = ChatLogRenderer;

})(window);

/**
 * 主题切换功能
 * 支持明亮/深色模式切换,并保存用户偏好
 */
(function() {
    'use strict';

    /**
     * 主题管理器
     */
    const ThemeManager = {
        // SVG图标定义
        icons: {
            sun: `
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            `,
            moon: `
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            `
        },

        /**
         * 初始化主题管理器
         */
        init() {
            this.themeToggle = document.getElementById('theme-toggle');
            this.themeIcon = document.getElementById('theme-icon');
            this.html = document.documentElement;

            if (!this.themeToggle || !this.themeIcon) {
                console.warn('主题切换元素未找到,跳过主题切换功能初始化');
                return;
            }

            // 从 localStorage 获取保存的主题，默认为深色模式
            const savedTheme = localStorage.getItem('theme') || 'dark';

            // 应用保存的主题
            this.applyTheme(savedTheme);

            // 绑定切换事件
            this.themeToggle.addEventListener('click', () => this.toggleTheme());

            console.log('✅ 主题切换功能初始化完成');
        },

        /**
         * 应用主题
         * @param {string} theme - 主题名称 ('light' 或 'dark')
         */
        applyTheme(theme) {
            if (theme === 'dark') {
                this.html.setAttribute('data-theme', 'dark');
                this.themeIcon.innerHTML = this.icons.moon;
                this.themeToggle.setAttribute('aria-checked', 'true');
            } else {
                this.html.setAttribute('data-theme', 'light');
                this.themeIcon.innerHTML = this.icons.sun;
                this.themeToggle.setAttribute('aria-checked', 'false');
            }
        },

        /**
         * 切换主题
         */
        toggleTheme() {
            const currentTheme = this.html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            this.applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);

            // 触发自定义事件,通知其他组件主题已切换
            window.dispatchEvent(new CustomEvent('themechange', { 
                detail: { theme: newTheme }
            }));
        },

        /**
         * 获取当前主题
         * @returns {string} 当前主题名称
         */
        getCurrentTheme() {
            return this.html.getAttribute('data-theme') || 'dark';
        }
    };

    // 等待 DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
    } else {
        ThemeManager.init();
    }

    // 导出到全局
    window.ThemeManager = ThemeManager;

})();
