import { BellIcon } from '@heroicons/react/outline';
import type {
  NewCollectNotification,
  NewCommentNotification,
  NewFollowerNotification,
  NewMentionNotification,
  NewMirrorNotification,
  NewReactionNotification,
  NotificationRequest
} from '@lenster/lens';
import {
  CustomFiltersTypes,
  NotificationTypes,
  useNotificationsQuery
} from '@lenster/lens';
import { Card, EmptyState, ErrorMessage } from '@lenster/ui';
import { t } from '@lingui/macro';
import type { FC } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { NotificationType } from 'src/enums';
import { useAppStore } from 'src/store/app';
import { usePreferencesStore } from 'src/store/preferences';

import NotificationShimmer from './Shimmer';
import CollectNotification from './Type/CollectNotification';
import CommentNotification from './Type/CommentNotification';
import FollowerNotification from './Type/FollowerNotification';
import LikeNotification from './Type/LikeNotification';
import MentionNotification from './Type/MentionNotification';
import MirrorNotification from './Type/MirrorNotification';

interface ListProps {
  feedType: string;
}

const List: FC<ListProps> = ({ feedType }) => {
  const highSignalNotificationFilter = usePreferencesStore(
    (state) => state.highSignalNotificationFilter
  );
  const currentProfile = useAppStore((state) => state.currentProfile);

  const getNotificationType = () => {
    switch (feedType) {
      case NotificationType.All:
        return;
      case NotificationType.Mentions:
        return [
          NotificationTypes.MentionPost,
          NotificationTypes.MentionComment
        ];
      case NotificationType.Comments:
        return [
          NotificationTypes.CommentedPost,
          NotificationTypes.CommentedComment
        ];
      case NotificationType.Likes:
        return [
          NotificationTypes.ReactionPost,
          NotificationTypes.ReactionComment
        ];
      case NotificationType.Collects:
        return [
          NotificationTypes.CollectedPost,
          NotificationTypes.CollectedComment
        ];
      default:
        return;
    }
  };

  // Variables
  const request: NotificationRequest = {
    profileId: currentProfile?.id,
    customFilters: [CustomFiltersTypes.Gardeners],
    notificationTypes: getNotificationType(),
    highSignalFilter: highSignalNotificationFilter,
    limit: 20
  };

  const { data, loading, error, fetchMore } = useNotificationsQuery({
    variables: { request }
  });

  const notifications = data?.notifications?.items;
  const pageInfo = data?.notifications?.pageInfo;
  const hasMore = pageInfo?.next;

  const onEndReached = async () => {
    if (!hasMore) {
      return;
    }

    await fetchMore({
      variables: { request: { ...request, cursor: pageInfo?.next } }
    });
  };

  if (loading) {
    return (
      <Card className="divide-y dark:divide-gray-700">
        <NotificationShimmer />
        <NotificationShimmer />
        <NotificationShimmer />
        <NotificationShimmer />
      </Card>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        className="m-3"
        title={t`Failed to load notifications`}
        error={error}
      />
    );
  }

  if (notifications?.length === 0) {
    return (
      <EmptyState
        message={t`Inbox zero!`}
        icon={<BellIcon className="text-brand h-8 w-8" />}
        hideCard
      />
    );
  }

  return (
    <Card>
      <Virtuoso
        useWindowScroll
        className="virtual-notification-list"
        data={notifications}
        endReached={onEndReached}
        itemContent={(_, notification) => {
          return (
            <div className="p-5">
              {notification.__typename === 'NewFollowerNotification' && (
                <FollowerNotification
                  notification={notification as NewFollowerNotification}
                />
              )}
              {notification.__typename === 'NewMentionNotification' && (
                <MentionNotification
                  notification={notification as NewMentionNotification}
                />
              )}
              {notification.__typename === 'NewReactionNotification' && (
                <LikeNotification
                  notification={notification as NewReactionNotification}
                />
              )}
              {notification.__typename === 'NewCommentNotification' && (
                <CommentNotification
                  notification={notification as NewCommentNotification}
                />
              )}
              {notification.__typename === 'NewMirrorNotification' && (
                <MirrorNotification
                  notification={notification as NewMirrorNotification}
                />
              )}
              {notification.__typename === 'NewCollectNotification' && (
                <CollectNotification
                  notification={notification as NewCollectNotification}
                />
              )}
            </div>
          );
        }}
      />
    </Card>
  );
};

export default List;
