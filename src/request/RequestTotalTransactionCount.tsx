import * as React from "react";
import { connect, Dispatch } from "react-redux";

import { ApiError, apiRequest } from "./ApiRequest";

interface OwnProps {
    onTransactionTotalCount: (transactionTotalCount: number) => void;
    onError: (e: ApiError) => void;
}

interface DispatchProps {
    dispatch: Dispatch;
}

type Props = OwnProps & DispatchProps;

class RequestTotalTransactionCount extends React.Component<Props> {
    public componentWillMount() {
        const { onError, onTransactionTotalCount, dispatch } = this.props;
        apiRequest({ path: `tx/count`, dispatch, showProgressBar: true })
            .then((response: any) => {
                onTransactionTotalCount(response);
            })
            .catch(onError);
    }

    public render() {
        return null;
    }
}

export default connect()(RequestTotalTransactionCount);
