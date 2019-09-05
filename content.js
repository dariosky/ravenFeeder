$(function () {
  let updateTimer, //debounced timer on changes
    lockUpdates = false,
    colorStyles = 'background: #AAF; color: #333; padding:5px;',
    logDOMchanges = false

  function markAllAsRead(e) {
    const $issue = $(e.target).closest('.issue'),
      $commentMarks = $issue.find('.mark-as-read:not(.mark-all-as-read)')
    console.info(`%cMark ${$commentMarks.length} as read`, colorStyles)
    e.stopPropagation()
    $commentMarks.click()
  }

  function goToFirstComment(e) {
    console.info('%cGo to first comment', colorStyles)
    const $issue = $(e.target).closest('.issue'),
      $first = $issue.find('.list-item').first()
    $first.click()
  }

  function initialize() {
    const logoUrl = chrome.runtime.getURL('images/rprss128.png')
    $('.feeder-logo')
      .css({
        backgroundImage: `url(${logoUrl})`,
        backgroundSize: 'contain',
        height: '60px',
        color: 'white',
        'text-align': 'center',
        'background-position': 'left',
        'line-height': '60px',
        'text-indent': '15px',
      })
      .text('RavenPack Feed')
    removeAdv()

    $('body')
      .on('click', '.issueHeader .mark-all-as-read', markAllAsRead)
      .on('click', '.issueHeader', goToFirstComment)
      .on('keypress',
        function (e) {
          console.log('eating keydown')
          e.preventDefault()
          e.stopPropagation()
        })
  }

  function removeAdv() {
    $('.more-features--message').parent().remove()
    $('.ad-container').remove()
  }

  function updatePosts() {
    console.info('%cUpdating posts ****', colorStyles)
    removeAdv()
    // the bottom ad post is added all the time - then - remove it all the time
    $('.consume-popup').attr(
      'style',
      'height: auto !important; width: 450px;',
    )
    $('#post-upgrade_post').remove()

    const $listContainer = $('.page-scroll-container').last(),
      $listItems = $listContainer.find('.list-item'), // array of listItems
      issueBlocks = [], // the list of blocks (Jira issues) as soon as they're foudn
      issueMaps = {} // map with the issue to the issueblock so we can insert in the block as we go
    let commentsCount = 0
    // console.log(`We have ${$listItems.length} posts`)

    $listItems.each((_, listItem) => {
      const $item = $(listItem),
        $itemText = $item.find('.item-title--text'),
        text = $itemText.text(),
        issueGroups = text.match(/^RE: \[(.*)] (.*)/)
      if ($item.data('post') === 'upgrade_post') {
        $item.remove()
        return
      }
      if (issueGroups) {
        commentsCount++
        const [_, issue, title] = issueGroups

        $itemText.remove() // get rid of the title

        if (!issueMaps[issue]) {
          issueMaps[issue] = {
            issue,
            title,
            children: [],
          }
          issueBlocks.push(issueMaps[issue]) //keep the ordered list
        }
        issueMaps[issue].children.push($item)
        $item.removeClass('even odd') // after sorting zebra would be random
        // console.log(issue, title)
      }
    })
    console.info(
      `%c${commentsCount} comments on ${issueBlocks.length} issues`,
      colorStyles,
    )

    // $listContainer.empty()

    $listContainer.append(
      issueBlocks.map(block => {
        let $parent = $listContainer.find(
          `.issue[data-issue='${block.issue}']`,
        )
        if (!$parent.length) {
          $parent = $('<div/>')
            .addClass('issue')
            .data('issue', block.issue)
            .append(
              $('<div/>')
                .addClass('issueHeader')
                .append(
                  $(`<div class="issueNumber">${block.issue}</div>`),
                  $(`<div class="issueTitle">${block.title}</div>`),
                  $(
                    '<div class="issueCommands">' +
                    '  <div class="tpl-count-group">' +
                    '    <div class="mark-as-read mark-all-as-read green-button--extra"' +
                    ' style="color:#69bb37; background-color: #e8f6df; margin-top:10px"' +
                    '>' +
                    '      All read ✔' +
                    '    </div>' +
                    '  </div>' +
                    '</div>',
                  ),
                ),
            )
        }
        $parent.append(block.children)
        return $parent // return to append in the $listContainer
      }),
    )

    setTimeout(() => {
      // unlock updates from text tick
      lockUpdates = false
    }, 0)
  }

  function watchChanges() {
    const MutationObserver =
      window.MutationObserver || window.WebKitMutationObserver,
      rootNode = $('.consume-popup').get(0),
      config = {
        attributes: true,
        childList: true,
        subtree: true,
      },
      callback = function (mutationsList, observer) {
        function updatePostsDebounced() {
          clearTimeout(updateTimer) //debounced
          lockUpdates = true
          updateTimer = setTimeout(updatePosts, 100)
        }

        mutationsList.forEach(mutation => {
          if (mutation.type === 'childList') {
            if (logDOMchanges) {
              console.log(
                `DOM change: ${mutation.addedNodes.length} added, ${mutation.removedNodes.length} removed.`,
                mutation,
              )
            }
            if (mutation.target.classList.contains('post-list-container')) {
              updatePostsDebounced()
            } else {
              mutation.addedNodes.forEach(node => {
                const nodeClasses = node.classList
                if (
                  nodeClasses &&
                  (nodeClasses.contains('list-item') ||
                    nodeClasses.contains('tpl-post-list'))
                ) {
                  updatePostsDebounced()
                }
              })
            }
          } else if (mutation.type === 'attributes') {
            if (logDOMchanges) {
              console.log(
                'The ' + mutation.attributeName + ' attribute was modified.',
              )
            }
          }
        })
      },
      observer = new MutationObserver(callback)

    observer.observe(rootNode, config)
  }

  initialize()

  function startObserving() {
    const $watched = $('.consume-popup')
    if ($watched.length) {
      watchChanges()
    } else {
      console.debug("I'll watch for changes again soon")
      setTimeout(startObserving, 500)
    }
  }

  setTimeout(startObserving, 0)

})
