import React, { Component } from 'react';
import PropTypes from 'prop-types';

export const createInstance = (defaultProps = {}) => {
    const { Consumer, Provider } = React.createContext();

    function renderChildren(children, data) {
        return (typeof children === 'function') ? children(data) : children;
    }

    function consumerFactory(condition) {
        return ({ children }) => (
            <Consumer>
                {state => condition(state) && renderChildren(children, condition(state))}
            </Consumer>
        );
    }

    class Async extends Component {
        static propTypes = {
            children: PropTypes.oneOfType([
                PropTypes.arrayOf(PropTypes.node),
                PropTypes.node,
                PropTypes.func
            ]).isRequired,
            action: PropTypes.func.isRequired,
            onDemand: PropTypes.bool,
        };

        static defaultProps = {
            onDemand: false,
            ...defaultProps,
        };

        static Pending = consumerFactory(state => (
            !state.error && !state.response && !state.isLoading
        ));

        static Loading = consumerFactory(state => (
            !state.error && !state.response && state.isLoading
        ));

        static Resolved = consumerFactory(state => (
            !state.isLoading && !state.error && state.response
        ));

        static Rejected = consumerFactory(state => (
            !state.isLoading && !state.response && state.error
        ));

        state = {
            isLoading: false,
            response: null,
            error: null,
        };

        componentDidMount() {
            if (!this.props.onDemand) {
                this._handleAction();
            }
        }

        render() {
            const { children, onDemand } = this.props;

            return (
                <Provider value={this.state}>
                    {renderChildren(children, {
                        ...this.state,
                        isPending: this._isPending(),
                        run: () => onDemand && this._handleAction(),
                        reload: () => this._handleAction(),
                    })}
                </Provider>
            );
        }

        _handleAction() {
            const { action, ...rest } = this.props;

            this.setState({
                isLoading: true,
                response: null,
                error: null,
            });

            Promise.resolve(action(rest))
                .then(response => this.setState({
                    response: (response || null),
                    isLoading: false,
                }))
                .catch(error => this.setState({
                    error: (error || null),
                    isLoading: false,
                }));
        }

        _isPending() {
            const { isLoading, response, error } = this.state;

            return (!isLoading && !response && !error);
        }
    }

    return Async;
};

export default createInstance();
